/**
 * Хук useScrollRestore.
 * Вся логика сохранения и восстановления скролла теперь централизованно
 * и надёжно обрабатывается глобальным компонентом ScrollRestoration в App.tsx
 * с поддержкой истории маршрутов, ResizeObserver и MutationObserver.
 * Хук сохранён для обратной совместимости вызовов в компонентах (Movies, Series, Games).
 */
export const useScrollRestore = (_delay: number = 0) => {
  // Global ScrollRestoration in App.tsx handles all scroll logic uniformly.
};
