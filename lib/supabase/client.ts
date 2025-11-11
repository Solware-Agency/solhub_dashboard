import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Configuración de Supabase para el Dashboard Admin
// 
// Este dashboard usa anon_key para lectura y API Routes para escritura.
// El service_role_key SOLO se usa en las API Routes (servidor), nunca en el cliente.
// Esto es seguro y elimina el warning de Vercel.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton pattern para evitar múltiples instancias
let supabaseInstance: SupabaseClient | null = null;

// Cliente Público (solo anon_key) - Para lectura
// Las operaciones de escritura (UPDATE, INSERT, DELETE) se hacen a través de API Routes
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: crear nueva instancia cada vez
    return createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Client-side: usar singleton
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
})();
