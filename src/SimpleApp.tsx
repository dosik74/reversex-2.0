import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Простой App компонент, который загружает сайт в iframe
 * Используется для Capacitor APK сборки
 */
export default function SimpleApp() {
  useEffect(() => {
    // Обработка системной кнопки Back на Android
    const handleBackButton = async () => {
      const element = document.querySelector('iframe') as HTMLIFrameElement;
      if (element && element.contentWindow) {
        try {
          // Пытаемся вернуться в iframe
          element.contentWindow.history.back();
        } catch {
          // Если не получилось, закрываем приложение
          CapacitorApp.exitApp();
        }
      }
    };

    CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      <iframe
        src="https://reversex.vercel.app/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        allow="geolocation; microphone; camera; payment; usb"
        title="ReverseX App"
      />
    </div>
  );
}
