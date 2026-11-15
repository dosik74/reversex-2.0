import React, { createContext, useContext, useState, useEffect } from "react";
import supabase from "@/utils/supabase";

interface BetaContextType {
  isBetaEnabled: boolean;
  isRegistered: boolean;
  setBetaEnabled: (enabled: boolean) => void;
  toggleBeta: () => void;
}

const BetaContext = createContext<BetaContextType | undefined>(undefined);

const BETA_STORAGE_KEY_PREFIX = "reversex_beta_mode_";

export const BetaProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isBetaEnabled, setIsBetaEnabledState] = useState(false);

  // Sync auth status
  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        const uid = session?.user?.id || null;
        setUserId(uid);
        setIsRegistered(!!uid);

        if (uid) {
          const saved = localStorage.getItem(`${BETA_STORAGE_KEY_PREFIX}${uid}`);
          setIsBetaEnabledState(saved === "true");
        } else {
          // Unregistered guests never have beta enabled
          setIsBetaEnabledState(false);
        }
      } catch (e) {
        console.warn("Error reading session in BetaContext:", e);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      setIsRegistered(!!uid);

      if (uid) {
        const saved = localStorage.getItem(`${BETA_STORAGE_KEY_PREFIX}${uid}`);
        setIsBetaEnabledState(saved === "true");
      } else {
        setIsBetaEnabledState(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const setBetaEnabled = (enabled: boolean) => {
    if (!userId) {
      setIsBetaEnabledState(false);
      return;
    }
    localStorage.setItem(`${BETA_STORAGE_KEY_PREFIX}${userId}`, enabled ? "true" : "false");
    setIsBetaEnabledState(enabled);
  };

  const toggleBeta = () => {
    setBetaEnabled(!isBetaEnabled);
  };

  return (
    <BetaContext.Provider
      value={{
        isBetaEnabled,
        isRegistered,
        setBetaEnabled,
        toggleBeta,
      }}
    >
      {children}
    </BetaContext.Provider>
  );
};

export const useBeta = () => {
  const context = useContext(BetaContext);
  if (!context) {
    throw new Error("useBeta must be used within BetaProvider");
  }
  return context;
};
