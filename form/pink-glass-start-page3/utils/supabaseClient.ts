import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://thhefxrmnejoxcftdpvq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaGVmeHJtbmVqb3hjZnRkcHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NjM2ODUsImV4cCI6MjA3ODEzOTY4NX0.rH2IK94T09cnWAMm00PtH0jvUTCnLqKLbTpdZ8FSX0k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
