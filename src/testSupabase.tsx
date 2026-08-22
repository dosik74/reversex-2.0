import supabase from "./utils/supabase.js";

async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("comments").select("*").limit(1);
    console.log("🔗 Текущий URL Supabase:", import.meta.env.VITE_SUPABASE_URL);
    if (error) {
      console.error("❌ Ошибка запроса:", error.message);
    } else {
      console.log("✅ Подключение к базе успешно:", data);
    }
  } catch (err) {
    console.error("❌ Ошибка при тестировании Supabase:", err);
  }
}

testSupabaseConnection();
