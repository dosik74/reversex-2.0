import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Film, QrCode } from "lucide-react";
import QRAuthModal from "@/components/QRAuthModal";
import { getAuthRedirectUrl } from "@/lib/authRedirect";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showQRAuth, setShowQRAuth] = useState(false);
  const [tab, setTab] = useState('signin');
  const [prefillEmail, setPrefillEmail] = useState('');

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

  /** После обычного логина возвращаемся к ожидающему QR-подтверждению, если оно есть */
  const redirectAfterLogin = () => {
    const pending = sessionStorage.getItem('qr_pending_session');
    if (pending) {
      sessionStorage.removeItem('qr_pending_session');
      navigate(`/qr-auth?session=${pending}`);
    } else {
      navigate('/');
    }
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
      
      toast.success('Account created successfully!');
      redirectAfterLogin();
    } catch (error: any) {
      // Email уже занят — это не баг, а штатный ответ Supabase (422).
      // Не ругаемся, а мягко ведём на вход с подставленным email.
      if (/already registered|already exists|duplicate/i.test(error.message || '')) {
        setPrefillEmail(email);
        setTab('signin');
        toast.info('Этот email уже зарегистрирован — войдите с паролем.');
      } else {
        toast.error(error.message);
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
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png"
            alt="ReverseX"
            className="h-24 w-auto mx-auto mb-4"
          />
          <p className="text-muted-foreground">Track movies, games, music, books and more</p>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mb-3"
              variant="outline"
            >
              Continue with Google
            </Button>

            <Button
              onClick={() => setShowQRAuth(true)}
              disabled={loading}
              className="w-full mb-6"
              variant="outline"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Сканировать QR-код
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      key={prefillEmail}
                      defaultValue={prefillEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="moviefan123"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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