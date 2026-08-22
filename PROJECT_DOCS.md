# 🎬 Reverse - Movie & Series Tracking Platform

A modern, feature-rich web application for tracking movies, TV series, and managing your personal media library.

## ✨ Features

### Core Features
- **🎥 Movie & Series Database** - Browse thousands of movies and TV series
- **📊 Personal Tracking** - Mark movies as watched, currently watching, or want to watch
- **⭐ Rating System** - Rate and review movies with detailed scores
- **❤️ Favorites** - Save your favorite movies and series
- **📋 Watchlists** - Create and manage custom watchlists
- **💬 Comments & Reviews** - Share your opinions with other users
- **👥 Social Features** - Follow friends and see their activity
- **🔐 User Profiles** - Customizable profiles with avatars and bios
- **📈 Statistics** - View your watching history and statistics
- **🔔 Notifications** - Get notified about friend requests and interactions
- **💬 Messaging** - Send direct messages to other users

### Technical Features
- **⚡ Real-time Updates** - Using Supabase for live data sync
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🎨 Modern UI** - Beautiful dark theme with Tailwind CSS
- **🚀 Fast Performance** - Built with Vite for instant load times
- **🔐 Secure Authentication** - Supabase Auth with Google OAuth support
- **♿ Accessible** - WCAG compliant UI components

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.21** - Build tool
- **Tailwind CSS 3.4.17** - Styling
- **shadcn/ui** - Component library
- **React Router DOM 6.30.1** - Routing
- **TanStack React Query 5.83.0** - Server state management
- **Sonner** - Toast notifications

### Backend & Services
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Storage for images

### Development
- **ESLint** - Code linting
- **Vite** - Fast development server
- **Node.js** - Runtime environment

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm/bun
- Supabase account

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/dosik67/reverseX.git
cd reverseX
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm run dev
# or
bun run dev
```

5. **Open in browser**
Navigate to `http://localhost:8080`

## 🚀 Deployment

### Build for production
```bash
npm run build
# or
bun run build
```

### Deploy to hosting
The project can be deployed to:
- **Vercel** (recommended for Vite + React)
- **Netlify**
- **GitHub Pages**
- **Traditional hosting** (any static file server)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main app layout
│   ├── MovieCard.tsx   # Movie card component
│   ├── NotificationsPanelComponent.tsx
│   ├── MessagesPanelComponent.tsx
│   ├── RatingDialogComponent.tsx
│   ├── CommentsComponent.tsx
│   ├── WatchStatusComponent.tsx
│   └── ui/             # shadcn/ui components
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Movies.tsx      # Movies listing
│   ├── Series.tsx      # Series listing
│   ├── Profile.tsx     # User profile
│   ├── Auth.tsx        # Login/signup
│   └── ...
├── context/            # React Context
│   └── AppContext.tsx  # Global app state
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── utils/              # Helper functions
│   └── supabase.ts     # Supabase client
└── App.tsx             # Root component
```

## 🔐 Authentication

The app uses Supabase Authentication with support for:
- Email/Password login
- Google OAuth
- Auto session recovery
- Secure logout

## 📊 Database Schema

### Key Tables
- **profiles** - User profile information
- **movies** - Movie data
- **series** - TV series data
- **user_movies** - Watch status tracking
- **favorite_movies** - Favorite movies
- **comments** - User comments and reviews
- **ratings** - Movie/series ratings
- **friendships** - Social connections
- **messages** - Direct messages
- **notifications** - User notifications

## 🎨 Customization

### Colors
Modify the theme colors in `tailwind.config.ts`:
```ts
colors: {
  primary: 'hsl(280, 100%, 70%)',     // Purple accent
  accent: 'hsl(330, 100%, 65%)',      // Pink accent
  // ... other colors
}
```

### Components
Edit individual component styling in `src/components/`:
- Modify component props for easy customization
- Use Tailwind classes for styling changes
- Update shadcn/ui configuration in `components/ui/`

## 🐛 Troubleshooting

### Grey/Black Screen
- Check browser console for errors
- Ensure Supabase credentials are correct
- Clear browser cache: `Ctrl+Shift+Delete`

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Connection Issues
- Verify VITE_SUPABASE_URL is correct
- Check VITE_SUPABASE_ANON_KEY is valid
- Ensure Supabase project is active

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**dosik67** - GitHub

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Vite](https://vitejs.dev) - Build tool
- [React](https://react.dev) - UI framework

## 📞 Support

For support, please:
1. Check existing issues on GitHub
2. Create a new issue with detailed information
3. Include screenshots and error messages

---

**Happy tracking! 🍿🎬**
