import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const useScrollRestore = (delay: number = 0) => {
  const { pathname } = useLocation();
  const scrollRestoredRef = useRef(false);

  // Save scroll position when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${pathname}`, window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Restore scroll position after content loads
  useEffect(() => {
    scrollRestoredRef.current = false;
    
    const restoreScroll = () => {
      if (scrollRestoredRef.current) return;
      scrollRestoredRef.current = true;
      
      const savedScroll = sessionStorage.getItem(`scroll-${pathname}`);
      if (savedScroll) {
        const scrollPos = parseInt(savedScroll);
        window.scrollTo({
          top: scrollPos,
          left: 0,
          behavior: 'auto'
        });
      }
    };

    if (delay > 0) {
      const timer = setTimeout(restoreScroll, delay);
      return () => clearTimeout(timer);
    } else {
      // Try to restore immediately, then also try after a short delay
      restoreScroll();
      const timer = setTimeout(restoreScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, delay]);
};