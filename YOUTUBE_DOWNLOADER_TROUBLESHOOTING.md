# YouTube Downloader - Troubleshooting Checklist

## Pre-Setup Checklist

Before running the application, verify:

```
☐ Node.js is installed (v16+)
  Run: node --version
  
☐ npm is installed
  Run: npm --version
  
☐ Python is installed (3.7+)
  Run: python --version
  
☐ Git is installed (optional but recommended)
  Run: git --version
```

---

## Installation Checklist

```
☐ Dependencies installed
  Run: npm install
  Look for: "added X packages"
  
☐ yt-dlp is installed
  Run: yt-dlp --version
  Expected output: Version number like "2024.01.16"
  
☐ All required packages present
  Run: npm list express cors axios uuid
  Look for: All packages listed
```

---

## Startup Checklist

```
☐ Backend server starts without errors
  Run: npm run server
  Look for: "🎬 YouTube Downloader Server running on http://localhost:3001"
  
☐ Frontend builds without errors
  Run: npm run dev
  Look for: "VITE v5.x.x ready in xxx ms"
  
☐ Both can run together
  Run: npm run dev:full
  Look for: Both servers starting
```

---

## Browser Checklist

```
☐ Frontend page loads
  Open: http://localhost:8080
  Should see: Home page loads
  
☐ YouTube downloader page loads
  Open: http://localhost:8080/youtube-downloader
  Should see: YouTube Downloader UI with input field
  
☐ Backend responds
  Open: http://localhost:3001/health
  Should see: { "status": "ok", "message": "..." }
  
☐ No CORS errors
  Open DevTools (F12)
  Go to Console tab
  No red CORS error messages
```

---

## Functional Testing Checklist

```
STEP 1: Load Video Info
  ☐ Enter YouTube URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
  ☐ Click "Load Video"
  ☐ Wait 2-5 seconds
  ☐ Should see: Video thumbnail, title, duration, uploader
  
STEP 2: Select Quality
  ☐ Multiple quality buttons appear
  ☐ Can click on different qualities
  ☐ Selected quality shows different color
  
STEP 3: Download Video
  ☐ Click "Download Video"
  ☐ Progress should show: "Downloading... XX%"
  ☐ After 30-60 seconds: "Download Completed!"
  ☐ File should download to Downloads folder
  ☐ File should be playable in video player
```

---

## Common Issues & Fixes

### Issue: "yt-dlp: command not found"

**Causes:**
- yt-dlp not installed
- Installation failed
- Python not in PATH

**Fixes:**
```bash
# Check if installed
yt-dlp --version

# If not found, install
pip install yt-dlp

# If still not found, try
python -m pip install yt-dlp

# On macOS with homebrew
brew install yt-dlp

# On Linux with package manager
sudo apt install yt-dlp
```

**Verify:**
```bash
yt-dlp --version
# Should show: 2024.01.16 (or similar version)
```

---

### Issue: "Cannot find module 'express'"

**Causes:**
- Dependencies not installed
- npm install failed
- node_modules corrupted

**Fixes:**
```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Verify
npm list express
```

---

### Issue: "Port 3001 already in use"

**Causes:**
- Another process using port 3001
- Server still running from before

**Fixes:**
```bash
# Use different port
PORT=3002 npm run server

# Or find and kill process
# Windows (PowerShell as Admin):
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# macOS/Linux:
lsof -i :3001
kill -9 [PID]
```

---

### Issue: "EACCES: permission denied"

**Causes:**
- Permission issues
- npm installed globally with sudo

**Fixes:**
```bash
# Fix npm permissions
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install
```

---

### Issue: Connection refused / Cannot connect to server

**Causes:**
- Backend not running
- Backend crashed
- Wrong port

**Fixes:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Start backend
npm run server

# Check logs for errors
npm run server 2>&1 | head -20

# Try different port
PORT=3002 npm run server

# Check if port is open
netstat -an | grep 3001
```

---

### Issue: "Failed to fetch video information"

**Causes:**
- Invalid YouTube URL
- Video is private/deleted
- Network issues
- yt-dlp outdated

**Fixes:**
```bash
# Verify URL format
# Should be: https://www.youtube.com/watch?v=VIDEO_ID

# Update yt-dlp
pip install --upgrade yt-dlp

# Test yt-dlp directly
yt-dlp -j "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Check internet connection
ping youtube.com
```

---

### Issue: Download starts but never completes

**Causes:**
- Video too large
- Network interrupted
- Timeout too short
- Disk space full

**Fixes:**
```bash
# Check disk space
df -h  # Linux/macOS
dir C:\  # Windows

# Try smaller quality
Select "480p" or "720p" instead of 4K

# Increase timeout
DOWNLOAD_TIMEOUT=1200 npm run server

# Check network
ping youtube.com
```

---

### Issue: "File not found after download"

**Causes:**
- Download incomplete
- File saving failed
- Wrong path

**Fixes:**
```bash
# Check downloads directory
ls -la downloads/

# Check file permissions
ls -la downloads/*/

# Try again with different quality

# Check server logs for errors
npm run server 2>&1 | grep -i error
```

---

### Issue: 404 error when accessing page

**Causes:**
- Wrong URL
- Page not registered
- Typo in route

**Fixes:**
```bash
# Correct URL:
http://localhost:8080/youtube-downloader

# Check App.tsx for route
grep -n "youtube-downloader" src/App.tsx

# Should see:
# import YouTubeDownloader from "./pages/YouTubeDownloader";
# <Route path="/youtube-downloader" element={<YouTubeDownloader />} />
```

---

### Issue: CORS error in browser console

**Causes:**
- Frontend/backend port mismatch
- CORS not enabled on backend
- Wrong API URL

**Fixes:**
```bash
# Check API_BASE_URL in component
grep "API_BASE_URL" src/pages/YouTubeDownloader.tsx

# Should be: http://localhost:3001

# Check CORS enabled in server.js
grep -n "cors()" server.js

# Check .env has correct API URL
grep VITE_API_URL .env
```

---

## Performance Checklist

```
Memory Usage
  ☐ Backend <500MB idle
  ☐ Frontend <200MB idle
  ☐ During download <1GB total

Disk Space
  ☐ At least 2GB free for downloads
  ☐ Downloads folder not full
  ☐ Cleanup working (old files deleted)

Network Speed
  ☐ Download speed consistent
  ☐ No timeout errors
  ☐ Progress bar moving

File Quality
  ☐ Video plays smoothly
  ☐ Audio synced
  ☐ No corruption
```

---

## Logs & Debugging

### Enable Debug Output

```bash
# Run with verbose logging
DEBUG=* npm run server

# Or add to code:
console.log('Debug info:', variable);
```

### Check Browser Console

```
F12 → Console tab

Should be clear or only warnings.
No red CORS or network errors.
```

### Check Server Logs

```bash
# Look for these on startup:
✅ "YouTube Downloader Server running"
✅ "Downloads directory: ./downloads"
✅ "API endpoints:"
```

### Monitor Downloads Directory

```bash
# Check what's downloading
ls -la downloads/

# Check file size growth
du -h downloads/

# Watch cleanup working
ls -la downloads/ | wc -l
# Number should decrease after 24 hours
```

---

## Testing Tools

### Test Backend Directly

```bash
# Health check
curl http://localhost:3001/health

# Get video info
curl -X POST http://localhost:3001/api/video-info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Download video
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720p"}'
```

### Test yt-dlp Directly

```bash
# Get video info
yt-dlp -j "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Download specific quality
yt-dlp -f "bestvideo[height>=1080]+bestaudio" \
  -o "test.mp4" \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# List available formats
yt-dlp -F "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

---

## Final Verification

Run this checklist after setup:

```
☐ npm run dev:full starts without errors
☐ http://localhost:8080 loads
☐ http://localhost:8080/youtube-downloader loads
☐ http://localhost:3001/health returns OK
☐ Enter YouTube URL and click Load Video
☐ Video info appears with thumbnail
☐ Can select different qualities
☐ Download starts and completes
☐ File appears in Downloads folder
☐ Video file is playable
```

If all checks pass: ✅ **Setup Complete!**

If any check fails, go back to relevant troubleshooting section.

---

## Getting Help

If you're stuck:

1. Check this checklist again
2. Review relevant troubleshooting section
3. Check browser console (F12)
4. Check server terminal for errors
5. Try the debug commands above
6. Test components individually (backend, yt-dlp, etc.)

---

**Last Updated**: December 2024
**Version**: 1.0.0
