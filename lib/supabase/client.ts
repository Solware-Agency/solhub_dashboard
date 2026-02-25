import { createBrowserClient } from '@supabase/ssr';

// ⚠️ IMPORTANTE: Configuración de Supabase para el Dashboard Admin con SSR
// 
// Este cliente usa @supabase/ssr para manejar automáticamente las cookies de sesión.
// Esto permite que auth.uid() esté disponible en las consultas desde el cliente.
// Las sesiones se establecen en el login y se mantienen automáticamente.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente con SSR - Maneja cookies automáticamente
export const supabase = createBrowserClient(supabaseUrl, anonKey);
