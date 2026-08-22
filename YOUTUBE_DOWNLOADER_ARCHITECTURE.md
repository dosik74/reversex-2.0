# YouTube Downloader - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (localhost:8080)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React App (Vite Dev Server)                             │  │
│  │  ├─ src/App.tsx (routing)                                │  │
│  │  └─ src/pages/YouTubeDownloader.tsx (UI)                │  │
│  │     ├─ Video Info Section                               │  │
│  │     ├─ Quality Selector                                 │  │
│  │     ├─ Download Progress                                │  │
│  │     └─ File Download Handler                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↕ (HTTP/CORS)                                          │
└─────────────────────────────────────────────────────────────────┘
                           ↕
         ┌──────────────────────────────────────┐
         │   NETWORK (Internet)                 │
         │   - Fetch video metadata             │
         │   - Download video files             │
         └──────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────────┐
│           NODE.JS/EXPRESS SERVER                                │
│              (localhost:3001)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  server.js (Express App)                                 │  │
│  │  ├─ CORS Middleware                                      │  │
│  │  ├─ POST /api/video-info                                │  │
│  │  │   └─ Call yt-dlp to get metadata                     │  │
│  │  ├─ POST /api/download                                  │  │
│  │  │   └─ Call yt-dlp to download video                  │  │
│  │  ├─ POST /api/cleanup                                   │  │
│  │  │   └─ Remove old downloads (24h+)                    │  │
│  │  └─ GET /health                                         │  │
│  │      └─ Health check endpoint                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↕ (child_process.exec)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  yt-dlp Command Line Tool                                │  │
│  │  ├─ Fetch video metadata from YouTube                   │  │
│  │  ├─ Download video files                                │  │
│  │  └─ Merge video + audio streams                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↕ (File I/O)                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Local File System                                       │  │
│  │  ├─ downloads/                                          │  │
│  │  │   ├─ {uuid}/                                         │  │
│  │  │   │   └─ video_title.mp4                            │  │
│  │  │   └─ {uuid}/                                         │  │
│  │  │       └─ another_video.mp4                          │  │
│  │  └─ (Auto cleanup after 24 hours)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↕ (streaming files)                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↕
         ┌──────────────────────────────────────┐
         │   YOUTUBE.COM                        │
         │   - Video streams                    │
         │   - Metadata                         │
         └──────────────────────────────────────┘
```

---

## Data Flow: Download Process

### Step 1: User Input
```
User enters YouTube URL and clicks "Load Video"
         ↓
Browser sends POST request to /api/video-info
         ↓
Request includes: { url: "https://youtube.com/watch?v=..." }
```

### Step 2: Fetch Video Info
```
Express server receives request
         ↓
Validate URL (must be YouTube)
         ↓
Execute yt-dlp command:
  yt-dlp -j "URL" (returns JSON)
         ↓
Parse yt-dlp output
         ↓
Extract: title, duration, thumbnail, uploader, formats
         ↓
Send response back to browser as JSON
         ↓
React component displays:
  - Thumbnail image
  - Video title
  - Duration
  - Uploader name
  - Quality selector buttons
```

### Step 3: User Selects Quality & Downloads
```
User clicks "Download Video" button
         ↓
Browser sends POST request to /api/download
         ↓
Request includes: { url: "...", quality: "1080p" }
```

### Step 4: Download & Merge
```
Express receives download request
         ↓
Create unique download directory:
  downloads/{uuid}/
         ↓
Execute yt-dlp with quality format:
  yt-dlp -f "bestvideo[height>=1080]+bestaudio" "URL"
         ↓
yt-dlp:
  - Fetches best video stream
  - Fetches best audio stream
  - Merges them into MP4
  - Saves to downloads/{uuid}/video_title.mp4
         ↓
Express verifies file exists
         ↓
Get file size and details
         ↓
Send response with download URL:
  { filePath: "/downloads/{uuid}/video.mp4", fileSize: "...", ... }
```

### Step 5: Browser Download
```
React component receives response
         ↓
Shows success message
         ↓
Automatically creates download link
         ↓
User's browser saves file to Downloads folder
         ↓
Success! 🎉
```

### Step 6: Cleanup (automatic, happens hourly)
```
Server scheduled cleanup task runs
         ↓
Check all files in downloads/
         ↓
For each file:
  - Check modification time
  - If older than 24 hours:
    - Delete the file
    - Delete the directory
         ↓
Continue
```

---

## API Endpoint Detail Flows

### GET /health
```
GET http://localhost:3001/health
         ↓
Returns: { status: "ok", message: "Server is running" }
```

### POST /api/video-info
```
POST http://localhost:3001/api/video-info
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
         ↓
Command: yt-dlp -j "URL"
         ↓
Returns:
{
  "title": "Never Gonna Give You Up",
  "duration": 212,
  "thumbnail": "https://...",
  "uploader": "Rick Astley",
  "uploadDate": "20091025",
  "description": "...",
  "formats": [...]
}
```

### POST /api/download
```
POST http://localhost:3001/api/download
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "1080p"
}
         ↓
Quality mapping:
  "best"   → Auto best quality
  "4k"     → 2160p+ video
  "1440p"  → 1440p video
  "1080p"  → 1080p video
  "720p"   → 720p video
  "480p"   → 480p video
         ↓
Command: yt-dlp -f "[format_string]" -o "path/%(title)s.%(ext)s" "URL"
         ↓
Wait for yt-dlp to complete
         ↓
Returns:
{
  "success": true,
  "downloadId": "a1b2c3d4-...",
  "fileName": "Never_Gonna_Give_You_Up.mp4",
  "filePath": "/downloads/a1b2c3d4-.../Never_Gonna_Give_You_Up.mp4",
  "fileSize": "42.50 MB",
  "message": "Download completed successfully"
}
         ↓
Browser downloads file from /downloads/...
```

---

## Quality Selection Mapping

```
Quality    yt-dlp Format String
─────────────────────────────────────────────────────────────
best       Default (auto-select best available)
4k         bestvideo[height>=2160]+bestaudio/bestvideo[height>=2160]+bestaudio/best[height>=2160]
1440p      bestvideo[height>=1440]+bestaudio/bestvideo[height>=1440]+bestaudio/best[height>=1440]
1080p      bestvideo[height>=1080]+bestaudio/bestvideo[height>=1080]+bestaudio/best[height>=1080]
720p       bestvideo[height>=720]+bestaudio/bestvideo[height>=720]+bestaudio/best[height>=720]
480p       bestvideo[height>=480]+bestaudio/bestvideo[height>=480]+bestaudio/best[height>=480]
```

---

## File Structure During Download

```
downloads/ (auto-created)
└── a1b2c3d4-e5f6-4789-abcd-ef1234567890/  (unique ID per download)
    ├── Never_Gonna_Give_You_Up.mp4
    ├── Rick_Roll_HD.mp4
    └── (other downloaded videos...)

After 24 hours, entire directory is auto-deleted
```

---

## Error Handling Flow

```
User requests download
         ↓
URL validation
  ├─ Not YouTube? → Error: "Invalid YouTube URL"
  └─ Valid? Continue
         ↓
Execute yt-dlp
  ├─ 404 → Error: "Video not found"
  ├─ 429 → Error: "Too many requests"
  ├─ Private → Error: "Video unavailable"
  ├─ Timeout → Error: "Download timed out"
  └─ Success? Continue
         ↓
Verify file exists
  ├─ File missing? → Error: "File not found after download"
  └─ File exists? Continue
         ↓
Get file details and return success response
         ↓
Browser handles download
         ↓
Success response shown to user with download link
```

---

## Environment Variables & Configuration

```
.env file
─────────────────────
PORT=3001                           # Server port
VITE_API_URL=http://localhost:3001 # Frontend API URL
DOWNLOADS_DIR=./downloads           # (optional)
MAX_FILE_SIZE=5000                 # MB (optional)
DOWNLOAD_TIMEOUT=600               # seconds (optional)
AUTO_CLEANUP=true                  # Enable cleanup (optional)
CLEANUP_INTERVAL=24                # hours (optional)
```

---

## Performance Considerations

### Memory Usage
```
Idle Server:        ~50-100 MB
During Download:    +200-500 MB (for streaming)
Multiple Downloads: +500 MB per concurrent download
```

### Disk Space
```
Downloaded files: Depends on video quality
  480p:  ~100-300 MB
  720p:  ~300-800 MB
  1080p: ~800-2000 MB
  4K:    ~2000-5000+ MB
```

### Network
```
Fetching metadata: ~1-5 seconds
Downloading:       Depends on video length & quality
  1 hour video @ 720p: ~5-10 minutes
  1 hour video @ 4K:   ~15-30 minutes
```

---

## Security Layers

```
Browser
  ↓
CORS Validation (Express)
  ↓
URL Validation (Regex check for YouTube)
  ↓
File System Validation (Ensure files in downloads/ only)
  ↓
yt-dlp execution (Sandboxed child process)
  ↓
File Serving (Static directory only)
```

---

## Deployment Architecture (Production)

```
┌─────────────────┐
│  Your Domain    │
│  example.com    │
└────────┬────────┘
         │
    ┌────┴─────────────────────┐
    │                          │
    ↓                          ↓
┌─────────────┐         ┌──────────────┐
│  Vercel/    │         │  Node.js     │
│  Netlify    │         │  Server      │
│  (Frontend) │         │  (Backend)   │
│  React App  │←─HTTP──→│  Express     │
└─────────────┘         │  yt-dlp      │
                        └──────────────┘
                              ↓
                        ┌──────────────┐
                        │  Storage     │
                        │  Downloads/  │
                        └──────────────┘
```

---

This architecture provides:
✅ Separation of concerns (Frontend/Backend)
✅ Scalability (can run on separate servers)
✅ Security (input validation, sandboxed processes)
✅ Performance (streaming, cleanup, caching)
✅ Reliability (error handling, automatic cleanup)
