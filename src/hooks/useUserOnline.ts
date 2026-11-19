import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

/**
 * Онлайн-статус пользователя по реальной активности на сайте.
 *
 * useAnalytics() раз в минуту обновляет daily_visits.last_seen для каждой
 * сессии (session_id хранится в localStorage, то есть отдельно на каждом
 * устройстве). Если за последние ONLINE_WINDOW_MS есть хоть одна свежая
 * запись с этим user_id — человек сейчас на сайте с любого устройства.
 *
 * Никаких новых таблиц и миграций не требуется.
 */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const CHECK_INTERVAL_MS = 20 * 1000;

export function useUserOnline(userId?: string | null) {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOnline(false);
      setLoading(false);
      return;
    }

    let active = true;

    const check = async () => {
      try {
        const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
        const { data, error } = await supabase
          .from('daily_visits')
          .select('last_seen')
          .eq('user_id', userId)
          .gte('last_seen', since)
          .limit(1);

        if (!active) return;
        if (error) {
          console.error('Online status check failed:', error.message);
          return;
        }
        setOnline((data?.length ?? 0) > 0);
      } catch (err) {
        console.error('Online status check failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    // Сразу перепроверяем, когда пользователь вернулся во вкладку
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId]);

  return { online, loading };
}

export default useUserOnline;
