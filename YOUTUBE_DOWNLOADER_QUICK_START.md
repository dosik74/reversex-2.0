# 🎬 YouTube Downloader - Quick Start

## ⚡ 30-Second Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install yt-dlp
```bash
# Windows (PowerShell as Admin)
pip install yt-dlp

# macOS
brew install yt-dlp

# Linux
pip install yt-dlp
```

### 3. Run Everything
```bash
npm run dev:full
```

### 4. Open in Browser
```
http://localhost:8080/youtube-downloader
```

**That's it!** 🎉

---

## 📝 What You Can Do

1. ✅ Paste a YouTube link
2. ✅ Click "Load Video"
3. ✅ Choose quality (4K, 1080p, 720p, etc.)
4. ✅ Click "Download Video"
5. ✅ File downloads automatically

---

## 🔧 Separate Terminals (If Needed)

**Terminal 1:**
```bash
npm run server
```

**Terminal 2:**
```bash
npm run dev
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "yt-dlp not found" | Run: `pip install yt-dlp` |
| Connection refused | Start server: `npm run server` |
| Port already in use | Change PORT: `PORT=3002 npm run server` |
| 404 error | Video might be private/deleted |

---

## 📂 Accessing Downloaded Files

Downloaded files are stored in `./downloads/` folder.

You can also download them from the browser when the download completes.

---

## 🎯 Available Endpoints

- **Page**: `http://localhost:8080/youtube-downloader`
- **Server**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`

---

For detailed setup, see [YOUTUBE_DOWNLOADER_SETUP.md](./YOUTUBE_DOWNLOADER_SETUP.md)
