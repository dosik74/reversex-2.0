import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const useScrollPosition = () => {
  const location = useLocation();
  const scrollPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current[location.pathname] = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const savedPosition = scrollPositions.current[location.pathname] || 0;
    window.scrollTo(0, savedPosition);
  }, [location.pathname]);

  return scrollPositions;
};

export default useScrollPosition;