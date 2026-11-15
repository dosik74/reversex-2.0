import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { QrCode, ShieldCheck } from "lucide-react";
import QRAuthModal from "@/components/QRAuthModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/**
 * Служебный домен: Supabase Auth внутри всегда требует email.
 * Юзернейм конвертируется в детерминированный служебный email,
 * который пользователь никогда не видит и на который ничего не отправляется.
 */
const AUTH_EMAIL_DOMAIN = "users.reversex.app";

export const usernameToAuthEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

/** Разрешённые юзернеймы: 3–20 символов, латиница/цифры/_ */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showQRAuth, setShowQRAuth] = useState(false);
  const [tab, setTab] = useState('signin');
  // Постоянная ошибка (тосты исчезают — эта остаётся, чтобы было что скинуть)
  const [authError, setAuthError] = useState('');

  // --- Шаг 2FA (только если пользователь включил её в настройках) ---
  const [mfaPending, setMfaPending] = useState<{ factorId: string; challengeId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  // Если уже залогинен — показываем это явно, а не форму входа
  const [currentUserLabel, setCurrentUserLabel] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserLabel(session.user.user_metadata?.username || session.user.email || null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUserLabel(session?.user ? (session.user.user_metadata?.username || session.user.email) : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fail = (message: string) => {
    const mapped = /invalid login credentials/i.test(message || '')
      ? 'Неверный юзернейм или пароль'
      : /email not confirmed/i.test(message || '')
        ? 'Аккаунт ещё не активирован. Попробуйте войти позже.'
        : message;
    toast.error(mapped);
    setAuthError(mapped);
  };

  const redirectAfterLogin = () => {
    const pending = sessionStorage.getItem('qr_pending_session');
    if (pending) {
      sessionStorage.removeItem('qr_pending_session');
      navigate(`/qr-auth?session=${pending}`);
    } else {
      navigate('/');
    }
  };

  const saveQrAccount = (user: { id: string; email?: string }, username: string) => {
    localStorage.setItem(`qr_account_${user.id}`, JSON.stringify({
      id: user.id,
      email: user.email,
      username,
      lastLogin: new Date().toISOString(),
    }));
  };

  /**
   * После успешного входа по паролю проверяем, включена ли 2FA.
   * Если включена (aal1 → нужен aal2) — отправляем challenge и показываем ввод кода.
   */
  const checkMfaOrEnter = async (user: { id: string; email?: string }, username: string) => {
    try {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data.currentLevel === 'aal1' && aal.data.nextLevel === 'aal2') {
        const { data: factorData } = await supabase.auth.mfa.listFactors();
        const factor = factorData?.totp?.[0];
        if (factor) {
          const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: factor.id });
          if (error) throw error;
          setMfaPending({ factorId: factor.id, challengeId: challenge.id });
          setMfaCode('');
          return;
        }
      }
    } catch (e) {
      console.error('MFA check failed:', e);
      // MFA проверить не удалось — пускаем дальше, иначе можно вообще не войти
    }
    saveQrAccount(user, username);
    toast.success('Вы успешно вошли!');
    redirectAfterLogin();
  };

  const handleVerifyMfa = async (e?: React.FormEvent<HTMLFormElement>, codeOverride?: string) => {
    e?.preventDefault();
    const code = (codeOverride ?? mfaCode).replace(/\D/g, '');
    if (!mfaPending || code.length !== 6 || loading) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaPending.factorId,
        challengeId: mfaPending.challengeId,
        code,
      });
      if (error) throw error;
      setMfaPending(null);
      setMfaCode('');
      toast.success('Вы успешно вошли!');
      redirectAfterLogin();
    } catch (error: any) {
      fail('Неверный код 2FA. Попробуйте ещё раз.');
      setMfaCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setMfaCode(digits);
    if (digits.length === 6) handleVerifyMfa(undefined, digits);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get('username') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const password2 = String(formData.get('password2') || '');

    if (!USERNAME_RE.test(username)) {
      fail('Юзернейм: 3–20 символов, только латиница, цифры и _');
      return;
    }
    if (password.length < 6) {
      fail('Пароль должен быть минимум 6 символов');
      return;
    }
    if (password !== password2) {
      fail('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');

      // Проверяем занятость юзернейма (RPC; если не применён — пропускаем проверку)
      try {
        const { data: available } = await supabase.rpc('is_username_available', { p_username: username });
        if (available === false) {
          fail('Этот юзернейм уже занят');
          return;
        }
      } catch {
        // RPC ещё не создан — регистрируем без предпроверки
      }

      const { data, error } = await supabase.auth.signUp({
        email: usernameToAuthEmail(username),
        password,
        options: { data: { username } },
      });
      if (error) throw error;

      // Если в проекте включено подтверждение email — сессии не будет.
      if (!data.session) {
        setAuthError('Аккаунт создан, но требует активации. Отключи "Confirm email" в Supabase Dashboard → Authentication → Providers → Email.');
        toast.info('Выключи "Confirm email" в настройках Supabase, чтобы вход был без почты.');
        return;
      }

      if (data.user) saveQrAccount(data.user, username);
      toast.success('Аккаунт создан! Добро пожаловать.');
      redirectAfterLogin();
    } catch (error: any) {
      if (/already registered|already exists|duplicate|User already/i.test(error.message || '')) {
        fail('Этот юзернейм уже занят');
      } else {
        fail(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const usernameInput = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '');

    if (!usernameInput || !password) {
      fail('Введите юзернейм и пароль');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');

      // Если ввели email (старые аккаунты) — входим по нему напрямую,
      // иначе строим служебный email из юзернейма.
      const email = usernameInput.includes('@')
        ? usernameInput
        : usernameToAuthEmail(usernameInput);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const username = data.user?.user_metadata?.username || usernameInput.split('@')[0];
      await checkMfaOrEnter({ id: data.user!.id, email: data.user!.email || undefined }, username);
    } catch (error: any) {
      fail(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="ReverseX"
            className="h-24 w-auto mx-auto mb-4"
          />
          <p className="text-muted-foreground">{t('auth.tagline')}</p>
        </div>

        {currentUserLabel && !mfaPending ? (
          <Card className="card-glow">
            <CardHeader className="text-center">
              <span className="inline-flex w-14 h-14 rounded-full bg-green-500/15 items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✓</span>
              </span>
              <CardTitle>{t('auth.loggedIn')}</CardTitle>
              <CardDescription>{currentUserLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => redirectAfterLogin()}>
                {t('auth.continueBtn')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setCurrentUserLabel(null);
                }}
              >
                {t('auth.signOut')}
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>{t('auth.welcome')}</CardTitle>
            <CardDescription>Вход и регистрация по юзернейму и паролю</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowQRAuth(true)}
              disabled={loading}
              className="w-full mb-6"
              variant="outline"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {t('auth.scanQr')}
            </Button>

            {authError && (
              <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {authError}
              </div>
            )}

            {mfaPending ? (
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  Двухфакторная защита включена — введите код из приложения
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Код 2FA</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                    value={mfaCode}
                    onChange={(e) => handleMfaCodeChange(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Проверяем…' : 'Войти'}
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setMfaPending(null);
                    setMfaCode('');
                  }}
                >
                  Отмена
                </button>
              </form>
            ) : (
            <Tabs value={tab} onValueChange={(v) => { setTab(v); setAuthError(''); }} defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-username">{t('auth.username')}</Label>
                    <Input
                      id="signin-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="ваш_юзернейм"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('auth.signingIn') : t('auth.signInBtn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">{t('auth.username')}</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="ваш_юзернейм"
                      required
                    />
                    <p className="text-xs text-muted-foreground">3–20 символов: латиница, цифры, _</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password2">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="signup-password2"
                      name="password2"
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('auth.creating') : t('auth.signUpBtn')}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Никакой почты не нужно. Двухфакторную защиту можно включить позже в Настройках.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>

    <QRAuthModal
      open={showQRAuth}
      onClose={() => setShowQRAuth(false)}
      onSuccess={async () => {
        toast.success('Вы вошли через QR!');
        navigate('/');
      }}
    />
    </>
  );
};

export default Auth;
