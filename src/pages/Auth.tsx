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
import { Film, QrCode } from "lucide-react";
import QRAuthModal from "@/components/QRAuthModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getAuthRedirectUrl } from "@/lib/authRedirect";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showQRAuth, setShowQRAuth] = useState(false);
  const [tab, setTab] = useState('signin');
  const [prefillEmail, setPrefillEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  // Если уже залогинен — показываем это явно, а не форму входа
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setCurrentEmail(session.user.email);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentEmail(session?.user?.email || null);
    });
    return () => subscription.unsubscribe();
  }, []);
  // Вход по коду из письма (без пароля — заодно подтверждает email)
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // Сброс пароля: email → код из письма → новый пароль
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetVerified, setResetVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  // Постоянная ошибка (тосты исчезают — эта остаётся, чтобы было что скинуть)
  const [authError, setAuthError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      if (error) {
        console.error('Google OAuth error:', error);
        // Check if it's a configuration error
        if (error.message?.includes('provider') || error.message?.includes('not configured')) {
          toast.error('Google authentication is not configured yet. Enable it in Supabase settings.');
        } else {
          toast.error(error.message || 'Failed to sign in with Google');
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      // Don't show additional toast if already shown above
    } finally {
      setLoading(false);
    }
  };

  const handleQRAuthSuccess = async () => {
    // Сессия уже установлена модалкой через verifyOtp — просто заходим
    toast.success('Вы вошли через QR!');
    navigate('/');
  };

  /** Ошибка входа: тост + постоянная плашка (тосты исчезают — плашка остаётся для скриншота) */
  const fail = (message: string) => {
    const mapped = /invalid login credentials/i.test(message || '')
      ? t('auth.invalidCredentials')
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

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success('Код отправлен на почту!');
    } catch (error: any) {
      fail(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent<HTMLFormElement>, codeOverride?: string) => {
    e?.preventDefault();
    const code = (codeOverride ?? otpCode).replace(/\D/g, '');
    if (code.length !== 6 || loading) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: code,
        type: 'email',
      });
      if (error) throw error;
      if (!data.session) throw new Error('Не удалось войти. Запросите код заново.');
      toast.success('Вы успешно вошли!');
      redirectAfterLogin();
    } catch (error: any) {
      fail(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(digits);
    // Код ввёлся сам: как только 6 цифр — проверяем без кнопки
    if (digits.length === 6) {
      handleVerifyOtp(undefined, digits);
    }
  };

  // --- Сброс пароля через код из письма ---
  const handleSendResetCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      setAuthError('');
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: getAuthRedirectUrl(),
      });
      if (error) throw error;
      setResetCodeSent(true);
      setResetCode('');
      setResetVerified(false);
      toast.success(t('auth.getCode'));
    } catch (error: any) {
      fail(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e?: React.FormEvent<HTMLFormElement>, codeOverride?: string) => {
    e?.preventDefault();
    const code = (codeOverride ?? resetCode).replace(/\D/g, '');
    if (code.length !== 6 || loading) return;
    try {
      setLoading(true);
      setAuthError('');
      const { data, error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: code,
        type: 'recovery',
      });
      if (error) throw error;
      if (!data.session) throw new Error(t('auth.invalidCredentials'));
      setResetVerified(true);
      toast.success(t('auth.enter'));
    } catch (error: any) {
      fail(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setResetCode(digits);
    if (digits.length === 6) {
      handleVerifyResetCode(undefined, digits);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== newPassword2) {
      fail(t('auth.passMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      fail(t('auth.passShort'));
      return;
    }
    try {
      setLoading(true);
      setAuthError('');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('auth.resetOk'));
      // Чистим состояние сброса и заходим
      setResetEmail('');
      setResetCode('');
      setResetCodeSent(false);
      setResetVerified(false);
      setNewPassword('');
      setNewPassword2('');
      redirectAfterLogin();
    } catch (error: any) {
      fail(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetResetFlow = () => {
    setResetCodeSent(false);
    setResetVerified(false);
    setResetCode('');
    setNewPassword('');
    setNewPassword2('');
    setAuthError('');
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) throw error;

      // Если в проекте включено подтверждение email — сессии не будет.
      // Честно говорим проверить почту, а не делаем вид, что вошли.
      if (!data.session) {
        setPrefillEmail(email);
        setTab('signin');
        toast.info('Аккаунт создан! Подтвердите email по ссылке из письма, затем войдите.');
        return;
      }

      // Save account for QR auth
      if (data.user) {
        const accountKey = `qr_account_${data.user.id}`;
        localStorage.setItem(accountKey, JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          username: username,
          lastLogin: new Date().toISOString()
        }));
      }
      
      toast.success(t('auth.accountCreated'));
      redirectAfterLogin();
    } catch (error: any) {
      // Email уже занят — это не баг, а штатный ответ Supabase (422).
      // Не ругаемся, а мягко ведём на вход с подставленным email.
      if (/already registered|already exists|duplicate/i.test(error.message || '')) {
        setPrefillEmail(email);
        setTab('signin');
        toast.info('Этот email уже зарегистрирован — войдите с паролем.');
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Save account for QR auth
      if (data.user) {
        const accountKey = `qr_account_${data.user.id}`;
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single();
        
        localStorage.setItem(accountKey, JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          username: profile?.username || email.split('@')[0],
          lastLogin: new Date().toISOString()
        }));
      }
      
      toast.success('Вы успешно вошли!');
      redirectAfterLogin();
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

        {currentEmail ? (
          <Card className="card-glow">
            <CardHeader className="text-center">
              <span className="inline-flex w-14 h-14 rounded-full bg-green-500/15 items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✓</span>
              </span>
              <CardTitle>{t('auth.loggedIn')}</CardTitle>
              <CardDescription className="break-all">{currentEmail}</CardDescription>
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
                  setCurrentEmail(null);
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
            <CardDescription>{t('auth.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mb-3"
              variant="outline"
            >
              {t('auth.continueGoogle')}
            </Button>

            <Button
              onClick={() => setShowQRAuth(true)}
              disabled={loading}
              className="w-full mb-6"
              variant="outline"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {t('auth.scanQr')}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('auth.or')}</span>
              </div>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {authError}
              </div>
            )}

            <Tabs value={tab} onValueChange={(v) => { setTab(v); setAuthError(''); }} defaultValue="signin">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
                <TabsTrigger value="otp">{t('auth.codeTab')}</TabsTrigger>
                <TabsTrigger value="reset">{t('auth.resetTab')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      required
                      key={prefillEmail}
                      defaultValue={prefillEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('auth.signingIn') : t('auth.signInBtn')}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setTab('reset'); setAuthError(''); }}
                  >
                    {t('auth.forgotLink')}
                  </button>
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
                      placeholder={t('auth.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('auth.creating') : t('auth.signUpBtn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="otp">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">{t('auth.email')}</Label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.sending') : t('auth.getCode')}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('auth.otpHint')}
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-code">{t('auth.codeFromMail')} ({otpEmail})</Label>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        required
                        value={otpCode}
                        onChange={(e) => handleOtpCodeChange(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.checking') : t('auth.enter')}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('auth.otpMailHint')}
                    </p>
                    <button
                      type="button"
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    >
                      {t('auth.resendCode')}
                    </button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="reset">
                {!resetCodeSent ? (
                  <form onSubmit={handleSendResetCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">{t('auth.email')}</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.sending') : t('auth.getCode')}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('auth.resetDesc1')}
                    </p>
                  </form>
                ) : !resetVerified ? (
                  <form onSubmit={handleVerifyResetCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-code">{t('auth.codeFromMail')} ({resetEmail})</Label>
                      <Input
                        id="reset-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        required
                        value={resetCode}
                        onChange={(e) => handleResetCodeChange(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.checking') : t('auth.enter')}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('auth.resetDesc2')}
                    </p>
                    <button
                      type="button"
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={resetResetFlow}
                    >
                      {t('auth.resendCode')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSetNewPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-new-password">{t('auth.newPassword')}</Label>
                      <Input
                        id="reset-new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reset-new-password2">{t('auth.confirmPassword')}</Label>
                      <Input
                        id="reset-new-password2"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword2}
                        onChange={(e) => setNewPassword2(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.savingPass') : t('auth.setNewPass')}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { resetResetFlow(); setTab('signin'); }}
                    >
                      {t('auth.backToSignIn')}
                    </button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        )}
      </div>
    </div>

    <QRAuthModal 
      open={showQRAuth}
      onClose={() => setShowQRAuth(false)}
      onSuccess={handleQRAuthSuccess}
    />
    </>
  );
};

export default Auth;