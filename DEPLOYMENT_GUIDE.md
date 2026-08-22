# 🚀 Deployment & Setup Guide

## Local Development

### Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher (or bun 1.0+)
- Git
- A Supabase account

### Step 1: Clone Repository
```bash
git clone https://github.com/dosik67/reverseX.git
cd reverseX
```

### Step 2: Install Dependencies
```bash
# Using npm
npm install

# Using bun (faster)
bun install
```

### Step 3: Setup Environment Variables
Create `.env` file in root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

### Step 4: Get Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy Project URL and anon/public key
5. Paste into `.env` file

### Step 5: Start Development Server
```bash
# Using npm
npm run dev

# Using bun
bun run dev

# Access at http://localhost:8080
```

## Project Structure Setup

### Important Directories
```
reverseX/
├── src/                 # Source code
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── context/        # React Context
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Libraries
│   ├── utils/          # Utilities
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── public/             # Static assets
│   └── data/          # JSON data files
├── .env               # Environment variables (don't commit)
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript config
└── package.json       # Dependencies
```

## Building for Production

### Build Process
```bash
# Generate optimized build
npm run build

# Output goes to dist/ directory
```

### Build Output
```
dist/
├── index.html        # Main HTML file
├── assets/           # CSS, JS bundles
└── data/            # Static data files
```

### Build Optimization
- Minifies JavaScript and CSS
- Tree-shaking to remove unused code
- Code splitting for faster load times
- Asset compression

## Deployment Options

### Option 1: Vercel (Recommended)

#### Prerequisites
- Vercel account (free tier available)
- GitHub account with repository

#### Steps
1. **Push code to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add VITE_SUPABASE_URL
   - Add VITE_SUPABASE_ANON_KEY
   - Click Deploy

4. **Access Your Site**
   - Vercel provides a unique URL
   - Configure custom domain if needed

### Option 2: Netlify

#### Steps
1. **Connect GitHub to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add VITE_SUPABASE_*

3. **Deploy**
   - Netlify automatically deploys on git push

### Option 3: Traditional Hosting (Nginx/Apache)

#### Steps
1. **Build project locally**
```bash
npm run build
```

2. **Upload dist/ folder**
   - Use FTP, SCP, or your hosting provider's file manager
   - Upload to `/public_html` or similar

3. **Configure Server**
```nginx
# nginx configuration
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/reverseX;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. **Enable HTTPS**
```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### Option 4: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist .
EXPOSE 8080

CMD ["serve", "-s", ".", "-l", "8080"]
```

#### Build and Run
```bash
# Build image
docker build -t reversex .

# Run container
docker run -p 8080:8080 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  reversex
```

## Database Setup

### Supabase Tables Schema

#### profiles table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### user_movies table
```sql
CREATE TABLE user_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  movie_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL, -- watched, watching, want_to_watch
  watched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### ratings table
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  movie_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

### Development (.env)
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Production (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## Performance Optimization

### Caching Strategy
- Enable browser caching in web server
- Set appropriate Cache-Control headers
- Use CDN for assets

### Image Optimization
- Compress images before upload
- Use WebP format when possible
- Implement lazy loading

### Code Splitting
- Vite automatically handles code splitting
- Monitor bundle size with `npm run build`

## Monitoring & Logging

### Browser Console
- Check for errors in Developer Tools
- Monitor network requests
- Check localStorage for app state

### Supabase Monitoring
- View logs in Supabase dashboard
- Monitor API usage
- Check database query performance

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next dist
npm install
npm run build
```

### Runtime Errors
1. Check browser console (F12)
2. Check network tab for API errors
3. Verify environment variables
4. Check Supabase dashboard for errors

### Performance Issues
1. Check bundle size: `npm run build` and check dist/
2. Monitor Network tab for slow requests
3. Check React DevTools for unnecessary re-renders

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      - name: Deploy
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

## Domain & SSL

### Custom Domain (Vercel)
1. Go to Vercel Project Settings
2. Domains > Add Domain
3. Follow DNS configuration
4. SSL auto-enabled

### Custom Domain (Netlify)
1. Go to Site Settings
2. Domain Management
3. Add custom domain
4. Update DNS records
5. SSL auto-configured

## Backup & Recovery

### Backup Database
```bash
# Export Supabase data
pg_dump postgresql://user:password@project.supabase.co/postgres > backup.sql
```

### Restore Database
```bash
# Import backup
psql postgresql://user:password@project.supabase.co/postgres < backup.sql
```

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] Supabase RLS policies configured
- [ ] API keys rotated regularly
- [ ] HTTPS enabled on all domains
- [ ] CORS configured properly
- [ ] Input validation implemented
- [ ] SQL injection protection active
- [ ] XSS prevention enabled

---

**Deployment Successful! 🎉**
