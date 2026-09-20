import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import supabase from "@/utils/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CameraOff, LogIn, Keyboard } from "lucide-react";

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
  const [mode, setMode] = useState<'camera' | 'code'>('camera');
  const [code, setCode] = useState('');
  const [resolving, setResolving] = useState(false);
  const startedRef = useRef(false);
  const qrRef = useRef<Html5Qrcode | null>(null);

  // stop() кидает СИНХРОННО, если сканер не стартовал (нет камеры/прав) —
  // без этого гарда падает весь рендер в ErrorBoundary
  const safeStop = useCallback(() => {
    const qr = qrRef.current;
    if (!qr) return;
    try {
      const p = qr.stop() as unknown as Promise<void> | undefined;
      if (p && typeof (p as any).catch === 'function') {
        (p as Promise<void>).catch(() => {});
      }
    } catch {
      /* сканер не был запущен — нечего останавливать */
    }
    try {
      qr.clear();
    } catch {
      /* ignore */
    }
    qrRef.current = null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session?.user);
    });
  }, []);

  useEffect(() => {
    if (loggedIn !== true || mode !== 'camera' || startedRef.current) return;
    startedRef.current = true;

    const qr = new Html5Qrcode('qr-reader');
    qrRef.current = qr;
    let alive = true;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (!alive) return;
        try {
          const url = new URL(decodedText);
          const sid = url.searchParams.get('session');
          if (url.pathname === '/qr-auth' && sid) {
            setScanned(true);
            alive = false;
            safeStop();
            navigate(`/qr-auth?session=${sid}`);
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
      alive = false;
      safeStop();
    };
  }, [loggedIn, mode, navigate, safeStop]);

  /** Код с экрана сам подставляется: набрали 6 цифр — сразу ищем сессию */
  const resolveCode = async (digits: string) => {
    if (digits.length !== 6 || resolving) return;
    setResolving(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('qr_login_sessions')
        .select('id, status, expires_at')
        .eq('pair_code', digits)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) throw new Error('not-found');
      if (new Date(data.expires_at).getTime() < Date.now()) {
        throw new Error('expired');
      }
      safeStop();
      navigate(`/qr-auth?session=${data.id}`);
    } catch {
      setError('Код не найден или истёк. Проверьте цифры или отсканируйте QR.');
      setCode('');
    } finally {
      setResolving(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) resolveCode(digits);
  };

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
          {mode === 'camera' ? 'Наведите на QR-код' : 'Введите код с экрана'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Код с экрана входа на другом устройстве — подтверждение откроется само
        </p>
      </div>

      <div className="flex justify-center mb-5">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => { startedRef.current = false; setMode('camera'); setError(''); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${mode === 'camera' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Камера
          </button>
          <button
            onClick={() => { setMode('code'); setError(''); }}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${mode === 'code' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Код
          </button>
        </div>
      </div>

      {mode === 'code' ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              6 цифр под QR-кодом на экране входа — как наберёте, дальше само
            </p>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              disabled={resolving}
              className="text-center font-mono text-3xl font-bold tracking-[0.4em] tabular-nums h-16 max-w-xs mx-auto"
            />
            {resolving && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Ищем код...
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
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
      )}

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
