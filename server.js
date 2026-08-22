import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine yt-dlp command based on OS and environment
const pythonPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
let ytDlpCommand = 'python -m yt_dlp'; // Default to python module

// Try venv first, then fallback to system python
if (fs.existsSync(pythonPath)) {
  ytDlpCommand = `"${pythonPath}" -m yt_dlp`;
  console.log(`✓ Using venv Python: ${pythonPath}`);
} else {
  console.log(`⚠ venv Python not found at ${pythonPath}, using system python`);
  ytDlpCommand = 'python -m yt_dlp';
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Serve downloaded files with proper headers for download
app.use('/downloads', (req, res, next) => {
  res.setHeader('Content-Disposition', 'attachment');
  express.static(downloadsDir)(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'YouTube Downloader Server is running' });
});

// YouTube download endpoint - streams file directly
app.post('/api/download', async (req, res) => {
  const { url, quality } = req.body;

  // Validate URL
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const downloadId = uuidv4();
  const outputPath = path.join(downloadsDir, downloadId);

  try {
    // Create output directory for this download
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    let formatArg = 'best';
    if (quality === '4k') {
      formatArg = 'bestvideo[height>=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=2160]+bestaudio/best[height>=2160]';
    } else if (quality === '1440p') {
      formatArg = 'bestvideo[height>=1440][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1440]+bestaudio/best[height>=1440]';
    } else if (quality === '1080p') {
      formatArg = 'bestvideo[height>=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1080]+bestaudio/best[height>=1080]';
    } else if (quality === '720p') {
      formatArg = 'bestvideo[height>=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=720]+bestaudio/best[height>=720]';
    } else if (quality === '480p') {
      formatArg = 'bestvideo[height>=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=480]+bestaudio/best[height>=480]';
    }

    // Build yt-dlp command
    const command = `${ytDlpCommand} -f "${formatArg}" -o "${path.join(outputPath, '%(title)s.%(ext)s')}" "${url}"`;

    console.log(`Starting download with ID: ${downloadId}`);
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 600000, // 10 minutes timeout
    });

    // Get the downloaded file
    const files = fs.readdirSync(outputPath);
    const videoFile = files.find(f => !f.startsWith('.'));

    if (!videoFile) {
      throw new Error('Download completed but no file found');
    }

    const filePath = path.join(outputPath, videoFile);
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;

    // Stream the file directly as binary data
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(videoFile)}"`);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });

    fileStream.on('end', () => {
      console.log(`Download completed and streamed: ${downloadId} - ${videoFile}`);
      // Clean up after 1 hour
      setTimeout(() => {
        try {
          fs.rmSync(outputPath, { recursive: true, force: true });
          console.log(`Cleaned up download: ${downloadId}`);
        } catch (e) {
          console.error('Cleanup error:', e.message);
        }
      }, 60 * 60 * 1000);
    });

  } catch (error) {
    console.error(`Download failed for ID ${downloadId}:`, error.message);

    // Clean up on error
    try {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up:', cleanupError.message);
    }

    let errorMessage = 'Download failed. Please try again.';
    if (error.message.includes('404')) {
      errorMessage = 'Video not found. Please check the URL.';
    } else if (error.message.includes('429')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('unavailable')) {
      errorMessage = 'Video is unavailable. It may be private or deleted.';
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.message,
      });
    }
  }
});

// Get video info endpoint
app.post('/api/video-info', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const command = `${ytDlpCommand} -j "${url}"`;
    const { stdout } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    const videoData = JSON.parse(stdout);

    res.json({
      title: videoData.title,
      duration: videoData.duration,
      thumbnail: videoData.thumbnail,
      uploader: videoData.uploader,
      uploadDate: videoData.upload_date,
      description: videoData.description,
      formats: videoData.formats ? videoData.formats.map(f => ({
        format_id: f.format_id,
        format: f.format,
        ext: f.ext,
        resolution: f.format_note || f.height,
        fps: f.fps,
        vcodec: f.vcodec,
        acodec: f.acodec,
      })) : [],
    });
  } catch (error) {
    console.error('Failed to get video info:', error.message);
    res.status(500).json({
      error: 'Failed to fetch video information',
      details: error.message,
    });
  }
});

// Clean up old downloads (older than 24 hours)
app.post('/api/cleanup', (req, res) => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  fs.readdirSync(downloadsDir).forEach(dir => {
    const dirPath = path.join(downloadsDir, dir);
    const stats = fs.statSync(dirPath);

    if (now - stats.mtimeMs > maxAge) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Cleaned up old download: ${dir}`);
    }
  });

  res.json({ message: 'Cleanup completed' });
});

// Helper function to validate YouTube URLs
function isValidYouTubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
  return youtubeRegex.test(url);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 YouTube Downloader Server running on http://localhost:${PORT}`);
  console.log(`📁 Downloads directory: ${downloadsDir}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   POST /api/download - Download video`);
  console.log(`   POST /api/video-info - Get video information`);
  console.log(`   POST /api/cleanup - Clean up old downloads`);
  console.log(`   GET /health - Health check`);
});
