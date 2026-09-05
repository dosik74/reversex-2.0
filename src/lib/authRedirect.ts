// Единое место для auth-редиректов.
// Приоритет: VITE_SITE_URL (прод-домен) -> window.location.origin (локалка/preview).
// Это защищает от ситуации, когда Supabase Site URL указывает на старый домен:
// мы всегда просим вернуть пользователя на текущий/канонический домен,
// а в дашборде Supabase этот домен должен быть в Allow list.
export function getAuthRedirectUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  const base = (envUrl?.trim() || window.location.origin).replace(/\/+$/, "");
  return `${base}/`;
}
