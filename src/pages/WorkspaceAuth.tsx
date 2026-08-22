import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

const WorkspaceAuth = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }

      navigate("/workspace");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
      isDark ? "bg-black" : "bg-white"
    }`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-24 p-3 rounded-lg transition-all ${
          isDark
            ? "bg-white hover:bg-gray-100 text-black"
            : "bg-black hover:bg-gray-900 text-white"
        }`}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 relative group">
        <button
          className={`p-3 rounded-lg transition-all flex items-center gap-2 ${
            isDark
              ? "bg-white hover:bg-gray-100 text-black"
              : "bg-black hover:bg-gray-900 text-white"
          }`}
          title="Change language"
        >
          <Globe size={20} />
          <span className="text-sm font-medium">{language.toUpperCase()}</span>
        </button>
        <div className={`absolute right-0 mt-10 rounded-lg shadow-lg hidden group-hover:block z-10 ${isDark ? "bg-black border border-white" : "bg-white border border-black"}`}>
          <button
            onClick={() => setLanguage("ru")}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors whitespace-nowrap ${
              language === "ru"
                ? isDark ? "bg-white text-black" : "bg-black text-white"
                : isDark ? "text-white hover:bg-gray-900" : "text-black hover:bg-gray-100"
            } rounded-t-lg`}
          >
            🇷🇺 Русский
          </button>
          <button
            onClick={() => setLanguage("kk")}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors whitespace-nowrap ${
              language === "kk"
                ? isDark ? "bg-white text-black" : "bg-black text-white"
                : isDark ? "text-white hover:bg-gray-900" : "text-black hover:bg-gray-100"
            } rounded-b-lg`}
          >
            🇰🇿 Қазақша
          </button>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md px-6"
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className={`text-4xl font-light tracking-tight mb-2 ${isDark ? "text-white" : "text-black"}`}>Workspace</h1>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            {isLogin ? "Sign in to your workspace" : "Create a new workspace"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleAuth}
          className="space-y-4"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 border rounded-lg text-sm ${
                isDark
                  ? "bg-red-900/20 border-red-800 text-red-300"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`w-full px-4 py-3 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                isDark
                  ? "bg-gray-900 text-white border border-gray-700 focus:border-white focus:ring-white"
                  : "bg-white text-black border border-gray-300 focus:border-black focus:ring-black"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-black"}`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                isDark
                  ? "bg-gray-900 text-white border border-gray-700 focus:border-white focus:ring-white"
                  : "bg-white text-black border border-gray-300 focus:border-black focus:ring-black"
              }`}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 ${
              isDark
                ? "bg-white text-black hover:bg-gray-100"
                : "bg-black text-white hover:bg-gray-900"
            }`}
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </motion.button>
        </motion.form>

        {/* Toggle Auth Type */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className={`font-medium transition-colors ${
                isDark
                  ? "hover:text-white text-gray-300"
                  : "hover:text-black text-gray-700"
              }`}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>

        {/* Back to Main */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <button
            onClick={() => navigate("/")}
            className={`text-sm transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            ← Back to reverseX
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WorkspaceAuth;
