import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

export default function App() {
  useEffect(() => {
    // Обработка кнопки Back на Android
    const handleBackButton = async () => {
      // Этот обработчик закроет приложение при нажатии назад на главной странице
      CapacitorApp.exitApp();
    };

    CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="https://reversex.vercel.app/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        allow="geolocation; microphone; camera; payment"
      />
    </div>
  );
}
