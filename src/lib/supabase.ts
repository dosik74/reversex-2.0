import { createClient } from "@supabase/supabase-js";

// Берём URL и ключ из .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mock builder для метод-чейнинга
const createMockQueryBuilder = () => {
  const mockPromise = Promise.resolve({ data: [], error: null });
  
  return {
    select: function() {
      return this;
    },
    eq: function() {
      return this;
    },
    neq: function() {
      return this;
    },
    lt: function() {
      return this;
    },
    lte: function() {
      return this;
    },
    gt: function() {
      return this;
    },
    gte: function() {
      return this;
    },
    like: function() {
      return this;
    },
    in: function() {
      return this;
    },
    contains: function() {
      return this;
    },
    containedBy: function() {
      return this;
    },
    range: function() {
      return this;
    },
    overlaps: function() {
      return this;
    },
    textSearch: function() {
      return this;
    },
    match: function() {
      return this;
    },
    single: function() {
      return mockPromise;
    },
    update: function() {
      return mockPromise;
    },
    delete: function() {
      return mockPromise;
    },
    insert: function() {
      return mockPromise;
    },
    upsert: function() {
      return mockPromise;
    },
    limit: function() {
      return this;
    },
    order: function() {
      return this;
    },
    offset: function() {
      return this;
    },
    then: function(resolve?: any) {
      return (resolve ? mockPromise.then(resolve) : mockPromise) as any;
    },
    catch: function(reject?: any) {
      return (reject ? mockPromise.catch(reject) : mockPromise) as any;
    },
    finally: function(fn?: any) {
      return (fn ? mockPromise.finally(fn) : mockPromise) as any;
    },
  };
};

// Создаём клиент Supabase только если переменные установлены
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase клиент инициализирован с URL:", supabaseUrl);
} else {
  console.warn("⚠️  Supabase переменные окружения не установлены. Используется mock клиент.");
  console.warn("📝 Убедитесь что установлены переменные окружения:");
  console.warn("   - VITE_SUPABASE_URL");
  console.warn("   - VITE_SUPABASE_ANON_KEY");
  
  // Полноценный mock объект для случаев когда нет переменных
  supabase = {
    from: () => createMockQueryBuilder(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: "Supabase not configured - Check environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)" } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    },
    realtime: {
      on: () => ({ unsubscribe: () => {} }),
    },
  };
}

export default supabase;
