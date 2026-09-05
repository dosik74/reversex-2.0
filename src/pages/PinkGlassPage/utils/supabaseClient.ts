// Единый синглтон — реэкспорт из @/lib/supabase.
// Раньше здесь был отдельный createClient с хардкодом, что давало
// Multiple GoTrueClient instances + Navigator LockManager конфликты.
export { default as supabase } from "@/lib/supabase";
import supabase from "@/lib/supabase";
export default supabase;
