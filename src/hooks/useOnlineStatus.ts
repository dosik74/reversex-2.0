import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";

export const useOnlineStatus = (userId: string) => {
  const [status, setStatus] = useState<string>("offline");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Обновляем каждые 30 сек

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleOnline = () => updateStatus("online");
    const handleOffline = () => updateStatus("offline");

    window.addEventListener("focus", handleOnline);
    window.addEventListener("blur", handleOffline);

    return () => {
      window.removeEventListener("focus", handleOnline);
      window.removeEventListener("blur", handleOffline);
    };
  }, [userId]);

  const fetchStatus = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .single();

      setStatus(data?.status || "offline");
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      setStatus(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return { status, loading, updateStatus };
};

export default useOnlineStatus;