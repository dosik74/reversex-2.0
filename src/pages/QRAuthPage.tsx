import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import supabase, { ensureSession } from "@/utils/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, ShieldCheck, Smartphone, LogIn, TriangleAlert } from "lucide-react";

interface QrSession {
  id: string;
  status: string;
  device_label: string | null;
  created_at: string;
  expires_at: string;
}

type Phase =
  | 'loading'
  | 'login-required'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'approve'
  | 'approving'
  | 'done'
  | 'cancelled'
  | 'error';

/**
 * Экран подтверждения на ТЕЛЕФОНЕ (где пользователь уже залогинен).
 * Сканировал QR → видишь, какое устройство просится → Подтвердить.
 * Сам вход выпускается одноразовым magiclink на сервере (edge-функция),
 * токены телефона никому не передаются.
 */
const QRAuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<QrSession | null>(null);
  const [email, setEmail] = useState('');
  const [errorText, setErrorText] = useState('');

  const sessionId = searchParams.get('session');

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setPhase('invalid');
      return;
    }

    // Сессию читаем ЛОКАЛЬНО (getSession), а не через сеть (getUser):
    // на мобильном интернете запрос user часто отваливается и «вход пропадает».
    // ensureSession заодно подбирает вход из legacy-ключа старых версий приложения.
    // Настоящая проверка всё равно будет на сервере в момент approve.
    const session = await ensureSession();
    const user = session?.user;
    if (!user) {
      // Запомним, куда вернуться после входа
      sessionStorage.setItem('qr_pending_session', sessionId);
      setPhase('login-required');
      return;
    }
    // Вход есть — отложенный возврат больше не нужен
    sessionStorage.removeItem('qr_pending_session');
    setEmail(user.email || '');

    const { data, error } = await supabase
      .from('qr_login_sessions')
      .select('id, status, device_label, created_at, expires_at')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      setPhase('invalid');
      return;
    }
    setSession(data as QrSession);

    if (data.status !== 'pending') {
      setPhase('used');
      return;
    }
    if (new Date(data.expires_at).getTime() < Date.now()) {
      setPhase('expired');
      return;
    }
    setPhase('approve');
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    // Если вход завершат в соседней вкладке — подхватим сами, без кнопок
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadSession();
    });
    return () => subscription.unsubscribe();
  }, [loadSession]);

  const handleApprove = async () => {
    if (!sessionId) return;
    setPhase('approving');
    try {
      const { data, error } = await supabase.functions.invoke('qr-approve', {
        body: { session_id: sessionId },
      });
      if (error) {
        let status = 0;
        try {
          status = (error as any)?.context?.status || 0;
        } catch {
          /* ignore */
        }
        if (status === 401) {
          // Токен телефона протух/отозван: сервер нас не узнал.
          // Молча кидать на экран входа нельзя — человек решит, что «всё равно не вошли».
          setErrorText('Сессия телефона устарела. Войдите заново (быстрее всего — таб «Код» на странице входа) и подтвердите ещё раз.');
          setPhase('error');
          return;
        }
        if (status === 410) {
          setPhase('expired');
          return;
        }
        if (status === 404) {
          // Edge-функция не задеплоена — дело не в коде, а в сервере
          setErrorText('QR-вход не настроен на сервере: функция qr-approve не задеплоена.');
          setPhase('error');
          return;
        }
        const serverMsg = (data as any)?.error;
        setErrorText(
          typeof serverMsg === 'string' && serverMsg
            ? `Сервер отклонил вход: ${serverMsg}`
            : 'Нет связи с сервером. Проверьте интернет и попробуйте снова.'
        );
        setPhase('error');
        return;
      }
      setPhase('done');
      toast.success('Вход подтверждён!');
    } catch (e) {
      console.error('QR approve failed:', e);
      setErrorText('Нет связи с сервером. Проверьте интернет и попробуйте снова.');
      setPhase('error');
    }
  };

  const handleCancel = async () => {
    if (sessionId) {
      await supabase.from('qr_login_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
    }
    setPhase('cancelled');
  };

  const goLogin = () => {
    if (sessionId) sessionStorage.setItem('qr_pending_session', sessionId);
    navigate('/auth');
  };

  const shell = (body: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">{body}</Card>
    </div>
  );

  if (phase === 'loading') {
    return shell(
      <CardContent className="pt-10 pb-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Проверяем код...</p>
      </CardContent>
    );
  }

  if (phase === 'login-required') {
    // Диагностика для скриншота: только факты, без секретов (значений нет, только имена ключей)
    let sbKeyNames: string[] = [];
    try {
      sbKeyNames = Object.keys(localStorage).filter((k) => k.startsWith('sb-'));
    } catch {
      sbKeyNames = ['storage-blocked'];
    }
    const buildSha =
      (import.meta as any).env?.VITE_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
    const sbHost = (() => {
      try {
        return new URL((supabase as any).supabaseUrl || '').host || '?';
      } catch {
        return '?';
      }
    })();
    return shell(
      <>
        <CardHeader className="text-center">
          <Smartphone className="w-10 h-10 mx-auto mb-2 text-primary" />
          <CardTitle>Войдите на телефоне</CardTitle>
          <CardDescription>
            QR-вход подтверждает аккаунт, в который вы вошли на этом устройстве
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={goLogin} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Войти
          </Button>
          <Button variant="ghost" onClick={() => loadSession()} className="w-full">
            Я уже вошёл — проверить снова
          </Button>
          <details className="text-[11px] text-muted-foreground/70 pt-1">
            <summary className="cursor-pointer select-none">Диагностика (для скриншота)</summary>
            <p className="mt-1 font-mono break-all">
              сайт: {window.location.host}<br />
              база: {sbHost}<br />
              ключи: {sbKeyNames.length ? sbKeyNames.join(', ') : '—'}<br />
              сборка: {buildSha}
            </p>
          </details>
        </CardContent>
      </>
    );
  }

  if (phase === 'invalid' || phase === 'used') {
    return shell(
      <CardContent className="pt-6 text-center">
        <p className="text-destructive mb-2">
          {phase === 'invalid' ? 'Неверный QR-код' : 'Этот код уже использован'}
        </p>
        <p className="text-sm text-muted-foreground">Отсканируйте свежий код на экране устройства.</p>
      </CardContent>
    );
  }

  if (phase === 'expired' || phase === 'cancelled') {
    return shell(
      <CardContent className="pt-6 text-center">
        <p className="mb-2">{phase === 'expired' ? 'Срок кода истёк (3 минуты)' : 'Вход отклонён'}</p>
        <p className="text-sm text-muted-foreground">Создайте новый QR на устройстве.</p>
      </CardContent>
    );
  }

  if (phase === 'done') {
    return shell(
      <CardContent className="pt-10 pb-10 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-green-500/15 items-center justify-center mb-4">
          <Check className="w-7 h-7 text-green-500" />
        </span>
        <p className="font-semibold text-lg mb-1">Вход подтверждён!</p>
        <p className="text-sm text-muted-foreground">Вернитесь к устройству — вы уже вошли.</p>
      </CardContent>
    );
  }

  if (phase === 'error') {
    return shell(
      <CardContent className="pt-10 pb-8 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center mb-4">
          <TriangleAlert className="w-7 h-7 text-red-400" />
        </span>
        <p className="font-semibold text-lg mb-1">Не получилось подтвердить</p>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">{errorText}</p>
        <Button onClick={() => loadSession()} className="w-full">
          Попробовать снова
        </Button>
      </CardContent>
    );
  }

  // approve / approving
  const created = session ? new Date(session.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
  const approving = phase === 'approving';

  return shell(
    <>
      <CardHeader className="text-center">
        <Smartphone className="w-10 h-10 mx-auto mb-2 text-primary" />
        <CardTitle>Войти на другом устройстве?</CardTitle>
        <CardDescription>
          Кто-то просит вход в ваш аккаунт{email ? ` (${email})` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm space-y-1.5">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Устройство</span>
            <span className="font-semibold text-right">{session?.device_label || 'Неизвестно'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Запрошено в</span>
            <span className="font-semibold tabular-nums">{created}</span>
          </div>
        </div>

        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          Если это не вы — нажмите «Отклонить». Код одноразовый, живёт 3 минуты.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={approving}>
            <X className="w-4 h-4 mr-2" />
            Отклонить
          </Button>
          <Button onClick={handleApprove} disabled={approving}>
            {approving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Подтвердить
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </>
  );
};

export default QRAuthPage;
