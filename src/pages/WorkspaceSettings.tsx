import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";

const WorkspaceSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      navigate("/workspace-auth");
      return;
    }
    setUser(data.session.user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/workspace-auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 sticky top-0 z-40 bg-white/95 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate("/workspace")}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Workspace
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-light tracking-tight mb-2">Settings</h1>
          <p className="text-gray-600 mb-12">Manage your workspace account</p>

          {/* Account Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-12 p-6 border border-gray-200 rounded-lg"
          >
            <h2 className="text-lg font-medium mb-6">Account Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={user?.id || ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-xs"
                />
              </div>
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 border-2 border-red-200 rounded-lg bg-red-50"
          >
            <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
            <p className="text-sm text-red-700 mb-6">
              Once you logout, you'll need to sign in again to access your workspace.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </motion.button>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

export default WorkspaceSettings;
