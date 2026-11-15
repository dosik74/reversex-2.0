import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Внутрисессионная память позиций скролла для моментального синхронного доступа
const scrollPositions = new Map<string, number>();

// Глобальные ссылки на текущий ключ и путь для перехвата pushState и кликов
let currentKeyGlobal = "";
let currentPathGlobal = "";

/**
 * Сохраняет позицию скролла для заданного ключа и пути
 */
const savePosition = (key: string, path: string, y: number) => {
  if (y < 0) return;

  if (key && key !== "default") {
    scrollPositions.set(key, y);
    try {
      sessionStorage.setItem(`rx_scroll_${key}`, String(y));
    } catch {}
  }

  if (path) {
    scrollPositions.set(path, y);
    try {
      sessionStorage.setItem(`rx_scroll_${path}`, String(y));
    } catch {}
  }
};

/**
 * Получает сохранённую позицию скролла
 */
const getSavedPosition = (key: string, path: string): number => {
  let y = (key && key !== "default" ? scrollPositions.get(key) : undefined) ?? scrollPositions.get(path);

  if (y === undefined) {
    const raw = (key && key !== "default" ? sessionStorage.getItem(`rx_scroll_${key}`) : null) ||
      sessionStorage.getItem(`rx_scroll_${path}`);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) y = parsed;
    }
  }

  if (y === undefined && typeof window !== "undefined" && (window.history?.state as any)?.usr?.rx_scroll !== undefined) {
    y = (window.history.state as any).usr.rx_scroll;
  }

  return y ?? 0;
};

// Единоразовый перехват истории pushState и кликов по ссылкам,
// чтобы зафиксировать точный скролл в момент клика ДО того, как DOM начнёт меняться
if (typeof window !== "undefined" && !(window as any).__rx_scroll_initialized) {
  (window as any).__rx_scroll_initialized = true;

  const origPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const currentY = window.scrollY;
    if (currentY > 0 && (currentKeyGlobal || currentPathGlobal)) {
      savePosition(currentKeyGlobal, currentPathGlobal, currentY);
    }
    return origPushState.apply(this, args);
  };

  // Перехват кликов по элементам страницы (включая карточки фильмов, ссылки, кнопки)
  window.addEventListener(
    "click",
    () => {
      const currentY = window.scrollY;
      if (currentY > 0 && (currentKeyGlobal || currentPathGlobal)) {
        savePosition(currentKeyGlobal, currentPathGlobal, currentY);
      }
    },
    { capture: true, passive: true }
  );
}

/**
 * Глобальный компонент восстановления скролла для всего приложения.
 * 1. При переходе на новую страницу (PUSH) скроллит страницу в самый верх (0, 0).
 * 2. При возврате назад / вперёд по истории (POP: кнопка «Назад», стрелки браузера, история):
 *    - Запоминает точную позицию скролла в пикселях.
 *    - Восстанавливает скролл даже если контент страницы (списки, фильмы, Top50)
 *      загружается асинхронно через API / Supabase — отслеживает догрузку контента
 *      через ResizeObserver и MutationObserver, мгновенно восстанавливая точную точку.
 *    - Отменяется ТОЛЬКО если пользователь сам осознанно прокрутил колесо мыши или свайпнул экран
 *      (НЕ отменяется при нажатии клавиш истории / Alt+Left / Backspace).
 */
export default function ScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'
  const isRestoringRef = useRef(false);
  const cancelRestorationRef = useRef<(() => void) | null>(null);

  // Обновляем глобальные указатели текущего маршрута
  currentKeyGlobal = location.key;
  currentPathGlobal = location.pathname + location.search;

  // 1. Отключаем дефолтное грубое браузерное восстановление, чтобы браузер не сбрасывал скролл до рендера React
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // 2. Непрерывно сохраняем текущий скролл во время активного пребывания на странице
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (isRestoringRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!isRestoringRef.current) {
            const y = window.scrollY;
            const key = location.key;
            const pathKey = location.pathname + location.search;

            // Защита: не затираем положительный сохранённый скролл нулём при схлопывании страницы
            const prevY = getSavedPosition(key, pathKey);
            if (y === 0 && prevY > 50) {
              ticking = false;
              return;
            }

            savePosition(key, pathKey, y);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const onBeforeUnload = () => {
      const y = window.scrollY;
      if (y > 0) {
        savePosition(location.key, location.pathname + location.search, y);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      // Важно: в cleanup намеренно НЕ вызываем savePosition(window.scrollY),
      // так как к моменту вызова cleanup React уже может размонтировать DOM
      // или перейти на новый роут, и window.scrollY может быть равен 0!
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [location.key, location.pathname, location.search]);

  // 3. Восстановление или сброс скролла при смене маршрута
  useEffect(() => {
    // Отменяем активное восстановление с предыдущей страницы (если было)
    if (cancelRestorationRef.current) {
      cancelRestorationRef.current();
      cancelRestorationRef.current = null;
    }

    // Если есть хеш в адресе (например, #profile-comments), скроллим к нему
    if (location.hash) {
      const targetId = location.hash.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // При обычном переходе ВПЕРЁД (PUSH: клик по ссылке / карточке) — скроллим наверх
    if (navType === "PUSH") {
      isRestoringRef.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      return;
    }

    // При возврате НАЗАД или ВПЕРЁД по истории (POP: кнопка «Назад», стрелки браузера)
    if (navType === "POP") {
      const key = location.key;
      const pathKey = location.pathname + location.search;

      const savedY = getSavedPosition(key, pathKey);

      // Если сохранённой позиции нет или пользователь был в самом верху (<= 0)
      if (savedY <= 0) {
        isRestoringRef.current = false;
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
        return;
      }

      // Начинаем асинхронное восстановление скролла с ожиданием догрузки контента
      isRestoringRef.current = true;
      const targetY = savedY;
      let cancelled = false;

      // Если пользователь САМ крутит колесо мыши или свайпает экран — прекращаем вмешательство
      // (НЕ вешаем на keydown, чтобы не сбивать скролл при клавиатурной навигации назад!)
      const onUserManualScroll = () => {
        cancelled = true;
        cleanup();
      };

      let resizeObserver: ResizeObserver | null = null;
      let mutationObserver: MutationObserver | null = null;
      let intervalId: any = null;

      const cleanup = () => {
        isRestoringRef.current = false;
        window.removeEventListener("wheel", onUserManualScroll);
        window.removeEventListener("touchstart", onUserManualScroll);
        window.removeEventListener("touchmove", onUserManualScroll);
        if (resizeObserver) resizeObserver.disconnect();
        if (mutationObserver) mutationObserver.disconnect();
        if (intervalId) clearInterval(intervalId);
      };

      cancelRestorationRef.current = cleanup;

      window.addEventListener("wheel", onUserManualScroll, { passive: true });
      window.addEventListener("touchstart", onUserManualScroll, { passive: true });
      window.addEventListener("touchmove", onUserManualScroll, { passive: true });

      const attemptScroll = () => {
        if (cancelled) return true;

        const docEl = document.documentElement;
        const body = document.body;
        const maxScrollY = Math.max(
          docEl.scrollHeight,
          body ? body.scrollHeight : 0
        ) - window.innerHeight;

        // Если документ уже достаточно высок для достижения цели
        if (maxScrollY >= targetY - 15) {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" as ScrollBehavior });

          // Если доскроллили до нужной точки (с допустимой погрешностью)
          if (Math.abs(window.scrollY - targetY) <= 8) {
            cleanup();
            return true;
          }
        } else if (maxScrollY > 0) {
          // Страница загружена частично — подкручиваем на максимум, чтобы не было прыжка в 0
          window.scrollTo({ top: maxScrollY, left: 0, behavior: "instant" as ScrollBehavior });
        }

        return false;
      };

      // 1. Немедленная попытка (сработает сразу, если данные уже в кэше)
      if (attemptScroll()) return;

      // 2. Отслеживаем изменение размеров через ResizeObserver
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          attemptScroll();
        });
        resizeObserver.observe(document.documentElement);
        if (document.body) {
          resizeObserver.observe(document.body);
        }
      }

      // 3. Отслеживаем вставку элементов в DOM через MutationObserver
      if (typeof MutationObserver !== "undefined" && document.body) {
        mutationObserver = new MutationObserver(() => {
          attemptScroll();
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
      }

      // 4. Интервальная страховка каждые 30мс в течение 5 секунд
      const startTime = Date.now();
      intervalId = setInterval(() => {
        if (cancelled || Date.now() - startTime > 5000) {
          cleanup();
          return;
        }
        attemptScroll();
      }, 30);

      return () => {
        cleanup();
      };
    }
  }, [location.key, location.pathname, location.search, location.hash, navType]);

  return null;
}
