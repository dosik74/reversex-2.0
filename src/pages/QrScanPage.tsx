import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import supabase from "@/utils/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, CameraOff, LogIn } from "lucide-react";

/**
 * Встроенный сканер QR-входа: работает внутри приложения,
 * где пользователь уже залогинен — никакие сторонние браузеры не нужны.
 * Нашёл код входа (/qr-auth?session=...) → сразу ведёт на подтверждение.
 */
const QrScanPage = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session?.user);
    });
  }, []);

  useEffect(() => {
    if (loggedIn !== true || startedRef.current) return;
    startedRef.current = true;

    const qr = new Html5Qrcode('qr-reader');
    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        try {
          const url = new URL(decodedText);
          const sid = url.searchParams.get('session');
          if (url.pathname === '/qr-auth' && sid) {
            setScanned(true);
            qr.stop().catch(() => {}).finally(() => navigate(`/qr-auth?session=${sid}`));
          } else {
            setError('Это не код входа ReverseX. Наведите камеру на QR с экрана входа.');
          }
        } catch {
          setError('Это не код входа ReverseX. Наведите камеру на QR с экрана входа.');
        }
      },
      () => {
        /* тихо игнорируем кадры без кода */
      }
    ).catch((e: any) => {
      console.error('Camera start failed:', e);
      const name = e?.name || '';
      setError(
        name === 'NotAllowedError'
          ? 'Нет доступа к камере. Разрешите доступ в настройках браузера и обновите страницу.'
          : 'Не удалось запустить камеру. Откройте страницу через камеру телефона и ссылку вручную.'
      );
    });

    return () => {
      qr.stop().catch(() => {});
      try {
        qr.clear();
      } catch {
        /* ignore */
      }
    };
  }, [loggedIn, navigate]);

  if (loggedIn === null) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Проверяем вход...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ScanLine className="w-10 h-10 mx-auto mb-2 text-primary" />
            <CardTitle>Сканер входа</CardTitle>
            <CardDescription>Сначала войдите в аккаунт на этом устройстве</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Войти
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="text-center mb-5">
        <h1 className="font-grotesk text-2xl sm:text-3xl font-bold tracking-tight">
          Наведите на QR-код
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Код с экрана входа на другом устройстве — подтверждение откроется само
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {!scanned ? (
            <div id="qr-reader" className="w-full" />
          ) : (
            <div className="py-14 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Код распознан, открываем...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm flex items-start gap-2.5">
          <CameraOff className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default QrScanPage;
