import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/supabase';

// Helper to get or create a session ID stored in localStorage.
// This allows tracking a unique device across multiple days.
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = getOrCreateSessionId();
  // Using a ref to prevent unnecessary re-renders or tight loops on route changes
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const trackPresence = async () => {
      try {
        // Only track if Supabase is initialized
        if (!supabase) return;
        
        // Get the current user if logged in, to attach their ID to the visit
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || null;

        // Current date string in YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // Upsert analytics event
        // This relies on the unique constraint (visit_date, session_id)
        const { error } = await supabase
          .from('daily_visits')
          .upsert(
            {
              visit_date: today,
              session_id: sessionId,
              user_id: userId,
              last_seen: new Date().toISOString(),
              // Note: page_views will default to 1 on insert, 
              // we don't increment it dynamically here because standard Supabase upsert from client 
              // overrides the row rather than evaluating `page_views = page_views + 1`. 
              // A tracking heartbeat is enough to update `last_seen` for online presence.
            },
            { onConflict: 'visit_date,session_id' }
          );

        if (error) {
          console.error('Analytics tracking error:', error.message);
        }
      } catch (err) {
         // Silently fail to not disrupt user experience
         console.error('Failed to track analytics:', err);
      }
    };

    // Track on route change if it's a new path
    if (lastTrackedPath.current !== location.pathname) {
      lastTrackedPath.current = location.pathname;
      trackPresence();
    }

    // Ping every 1 minute to keep "Online Now" accurate for active users
    const interval = setInterval(() => {
      trackPresence();
    }, 60000); 

    return () => clearInterval(interval);
  }, [location.pathname, sessionId]);
};
