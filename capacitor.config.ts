import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reversex.app',
  appName: 'ReverseX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['https://reversex.vercel.app/*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
