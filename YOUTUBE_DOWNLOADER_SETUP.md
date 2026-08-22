# YouTube Downloader Setup & Usage Guide

## Overview
A beautiful YouTube video downloader feature has been added to your website. This guide explains how to install, configure, and use it.

## What Was Added

### 1. **Backend Server** (`server.js`)
- Express.js server using yt-dlp library
- API endpoints for downloading and getting video information
- Automatic cleanup of old downloads
- Support for multiple video qualities (4K, 1440p, 1080p, 720p, 480p, auto)

### 2. **Frontend Page** (`src/pages/YouTubeDownloader.tsx`)
- Beautiful, modern UI with dark theme
- Real-time video information display
- Quality selection interface
- Download progress tracking
- Responsive design for mobile & desktop

### 3. **Routes**
- **Page URL**: `http://localhost:8080/youtube-downloader`
- **API Base**: `http://localhost:3001`

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `express` - Backend framework
- `cors` - Cross-origin support
- `axios` - HTTP client
- `uuid` - Unique ID generation
- `concurrently` - Run multiple processes

### Step 2: Install yt-dlp

The backend requires `yt-dlp` to be installed on your system.

#### Windows:
```bash
# Using pip (if you have Python installed)
pip install yt-dlp

# Or using choco (if you have Chocolatey)
choco install yt-dlp

# Or download from: https://github.com/yt-dlp/yt-dlp/releases
```

#### macOS:
```bash
brew install yt-dlp
```

#### Linux:
```bash
sudo apt-get install yt-dlp
# Or
pip install yt-dlp
```

### Step 3: Configure Environment Variables (Optional)

Create or update your `.env` file:

```env
# Backend Server
VITE_API_URL=http://localhost:3001
PORT=3001

# Existing variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Running the Application

### Option 1: Run Frontend & Backend Together (Recommended)

```bash
npm run dev:full
```

This command uses `concurrently` to start both:
- **Frontend**: Vite dev server on `http://localhost:8080`
- **Backend**: Express server on `http://localhost:3001`

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## API Endpoints

### 1. Download Video
**POST** `/api/download`

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "quality": "best" // or "4k", "1440p", "1080p", "720p", "480p"
}
```

Response:
```json
{
  "success": true,
  "downloadId": "uuid",
  "fileName": "video-title.mp4",
  "filePath": "/downloads/uuid/video-title.mp4",
  "fileSize": "1250.50 MB",
  "message": "Download completed successfully"
}
```

### 2. Get Video Information
**POST** `/api/video-info`

```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

Response:
```json
{
  "title": "Video Title",
  "duration": 3600,
  "thumbnail": "https://...",
  "uploader": "Channel Name",
  "uploadDate": "20240101",
  "description": "Video description...",
  "formats": [
    {
      "format_id": "135",
      "format": "1080p",
      "ext": "mp4",
      "resolution": "1080",
      "fps": 30,
      "vcodec": "h264",
      "acodec": "aac"
    }
  ]
}
```

### 3. Cleanup Old Downloads
**POST** `/api/cleanup`

Removes downloads older than 24 hours.

### 4. Health Check
**GET** `/health`

Check if server is running.

## Features

✨ **High Quality Downloads**
- 4K (2160p) support
- Multiple quality options
- Best quality auto-selection

⚡ **Fast & Efficient**
- Optimized downloading
- Progress tracking
- Quick file streaming

🎨 **Beautiful UI**
- Modern dark theme
- Gradient effects
- Responsive design
- Smooth animations

📱 **Cross-Platform**
- Works on desktop
- Mobile responsive
- All modern browsers

## Quality Settings

| Option | Quality | Best For |
|--------|---------|----------|
| Best Available | Auto | All videos |
| 4K | 2160p | High-quality content |
| 2K | 1440p | Laptops & tablets |
| Full HD | 1080p | Standard viewing |
| HD | 720p | Streaming |
| SD | 480p | Mobile |

## Troubleshooting

### Server not starting
```bash
# Check if port 3001 is already in use
# Change PORT in .env or use:
PORT=3002 npm run server
```

### yt-dlp not found
```bash
# Verify installation
yt-dlp --version

# If not found, install again:
pip install --upgrade yt-dlp
```

### Download fails with "Video not found"
- Check if the URL is correct
- Video might be private or deleted
- Try a different video

### Connection refused error
- Make sure backend server is running (`npm run server`)
- Check if port 3001 is accessible
- Frontend should be on `http://localhost:8080`

### CORS errors
- Backend automatically enables CORS
- Make sure API_URL matches in frontend code
- Check browser console for specific errors

## Files Structure

```
reverseX-main/
├── server.js                           # Express backend server
├── src/
│   ├── App.tsx                         # Updated with YouTube route
│   └── pages/
│       └── YouTubeDownloader.tsx       # Main UI component
├── package.json                        # Updated dependencies
└── downloads/                          # Downloaded files (auto-created)
```

## Performance Optimization

### Downloads Directory Cleanup
The server automatically cleans up downloads older than 24 hours. You can trigger manual cleanup:

```bash
curl -X POST http://localhost:3001/api/cleanup
```

### Disk Space Management
Monitor the `downloads/` directory size:

```bash
# Linux/macOS
du -sh downloads/

# Windows PowerShell
(Get-ChildItem downloads -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
```

## Security Considerations

✅ **Implemented:**
- URL validation (YouTube only)
- Error handling
- File cleanup
- CORS protection

⚠️ **Recommendations for Production:**
- Add authentication
- Rate limiting
- File size limits
- Disk space quotas
- HTTPS only
- Custom domain setup

## Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:3001
PORT=3001

# Optional: Set custom downloads directory
DOWNLOADS_DIR=./downloads

# Optional: Max file size in MB
MAX_FILE_SIZE=5000

# Optional: Download timeout in seconds
DOWNLOAD_TIMEOUT=600
```

## Advanced Configuration

### Custom Download Directory
Edit `server.js`:
```javascript
const downloadsDir = process.env.DOWNLOADS_DIR || path.join(__dirname, 'downloads');
```

### Custom Cleanup Schedule
Edit `server.js`:
```javascript
const maxAge = parseInt(process.env.MAX_AGE) || 24 * 60 * 60 * 1000; // 24 hours
```

### Rate Limiting
Install and add rate limiting middleware:
```bash
npm install express-rate-limit
```

## Support & Documentation

- **yt-dlp docs**: https://github.com/yt-dlp/yt-dlp
- **Express docs**: https://expressjs.com/
- **React docs**: https://react.dev/

## Deployment

### Vercel / Netlify (Frontend Only)
The frontend can be deployed to Vercel/Netlify as-is.

### Self-Hosted Backend
For production, deploy the Node.js server separately:

**Using PM2:**
```bash
npm install -g pm2
pm2 start server.js --name "youtube-downloader"
pm2 save
pm2 startup
```

**Using Docker:**
Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t youtube-downloader .
docker run -p 3001:3001 youtube-downloader
```

## License & Legal

⚠️ **Important**: Respect copyright laws and YouTube's Terms of Service when downloading videos. Only download content you have permission to use.

---

**Last Updated**: December 2024
**Version**: 1.0.0
