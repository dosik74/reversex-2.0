import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { TRANSLATIONS } from '../constants';

interface AuthModalProps {
  language: 'en' | 'ru';
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ language, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Ensures user comes back to the correct page
            redirectTo: window.location.origin, 
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        }
      });
      
      if (error) throw error;
      
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(err.message || "Failed to initialize Google Login");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg(language === 'ru' ? "Проверьте почту для подтверждения!" : "Check your email for confirmation!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel p-6 rounded-3xl shadow-2xl relative border border-white/10">
        <button 
           onClick={onClose}
           className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
        >
           <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.authTitle}</h2>

        {successMsg ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <CheckCircle size={48} className="text-green-400" />
                <p className="text-white/90">{successMsg}</p>
                <button 
                    onClick={() => setSuccessMsg(null)}
                    className="mt-4 text-sm theme-text-accent hover:text-white underline"
                >
                    {language === 'ru' ? 'Назад' : 'Back'}
                </button>
            </div>
        ) : (
            <>
                <div className="space-y-4">
                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-100 shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95"
                    >
                        {loading ? (
                           <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <svg viewBox="0 0 24 24" className="w-5 h-5">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        {language === 'ru' ? 'Войти через Google' : 'Continue with Google'}
                    </button>

                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-white/30 text-xs uppercase">{language === 'ru' ? 'или' : 'or'}</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg">
                            {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">{t.email}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                                <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)]"
                                placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">{t.password}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                                <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)]"
                                placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 rounded-xl theme-bg-accent border border-white/10 text-white font-medium hover:bg-white/10 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? '...' : (isSignUp ? (language === 'ru' ? 'Регистрация' : 'Sign Up') : t.login)} 
                            {!loading && (isSignUp ? <UserPlus size={18}/> : <LogIn size={18}/>)}
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center">
                    <button 
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                    {isSignUp 
                        ? (language === 'ru' ? "Уже есть аккаунт? Войти" : "Already have an account? Login") 
                        : (language === 'ru' ? "Нет аккаунта? Регистрация" : "No account? Sign Up")
                    }
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;