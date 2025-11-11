import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Configuración de Supabase para el Dashboard Admin
// 
// Este dashboard usa service_role para bypasear RLS y tener acceso completo.
// Como el dashboard NO usa autenticación de Supabase, usamos service_role
// directamente para que funcione sin problemas.
//
// NOTA: En producción, considera usar API Routes para proteger service_role,
// pero para desarrollo/admin interno esto es aceptable.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Cliente Admin (service_role) - Bypassa RLS
// ⚠️ IMPORTANTE: service_role se expone en el bundle del cliente
// Esto es aceptable para un dashboard administrativo interno,
// pero NO lo uses en aplicaciones públicas
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente Público (anon_key) - Respeta RLS (no se usa en este dashboard)
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton pattern para evitar múltiples instancias
let supabaseInstance: SupabaseClient | null = null;

// Cliente Principal del Dashboard
// Prioridad: service_role (si existe) > anon_key
// service_role bypassea RLS automáticamente, permitiendo acceso completo
export const supabase = (() => {
  const keyToUse = serviceRoleKey || anonKey;
  const keyType = serviceRoleKey ? 'service_role' : 'anon';
  
  // Log en desarrollo para debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔑 Cliente Supabase inicializado:', {
      keyType,
      hasServiceRole: !!serviceRoleKey,
      hasAnonKey: !!anonKey,
    });
  }

  if (typeof window === 'undefined') {
    // Server-side: crear nueva instancia cada vez
    return createClient(
      supabaseUrl,
      keyToUse,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'x-client-info': 'dashboard-admin',
          },
        },
      }
    );
  }

  // Client-side: usar singleton
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl,
      keyToUse,
      {
        auth: {
          persistSession: false, // No necesitamos sesión en admin
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'x-client-info': 'dashboard-admin',
          },
        },
      }
    );
  }
  return supabaseInstance;
})();
