// Единое место для auth-редиректов.
// ВСЕГДА возвращаем пользователя на тот домен, где он сейчас находится
// (window.location.origin): иначе stale VITE_SITE_URL, вшитый в старый
// билд на Vercel, уносит людей на заброшенный домен.
// Требование: текущий домен должен быть добавлен в Supabase Dashboard →
// Authentication → URL Configuration → Redirect URLs.
export function getAuthRedirectUrl(): string {
  return `${window.location.origin.replace(/\/+$/, "")}/`;
}
