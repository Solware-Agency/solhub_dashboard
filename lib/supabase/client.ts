import { createClient } from '@supabase/supabase-js';

// Estas variables deben venir de .env.local
// Crear el archivo .env.local con:
// NEXT_PUBLIC_SUPABASE_URL=https://sbqepjsxnqtldyvlntqk.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWVwanN4bnF0bGR5dmxudHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjU3OTUsImV4cCI6MjA2NTcwMTc5NX0.Pq0Fu-Lv-MrrkrrAQM60TYGgyTIuOwu33tzU31rbDvY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
