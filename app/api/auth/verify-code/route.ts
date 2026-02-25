import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente normal para autenticación
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cliente con service_role para verificar permisos (bypasea RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Intentar iniciar sesión con Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      console.error('[Auth] Error al autenticar:', authError);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar permisos usando service_role (bypasea RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_dashboard_admin, role, display_name')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Auth] Error al obtener perfil:', profileError);
      return NextResponse.json(
        { success: false, error: 'Error al verificar permisos' },
        { status: 500 }
      );
    }

    // Verificar que tenga el flag de dashboard admin
    if (!profile.is_dashboard_admin) {
      console.warn('[Auth] Usuario sin permisos de dashboard:', email);
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para acceder al dashboard' },
        { status: 403 }
      );
    }

    console.log('[Auth] Login exitoso:', email, '- Admin:', profile.display_name);

    return NextResponse.json({ 
      success: true,
      session: authData.session, // Devolver sesión completa para que el cliente la establezca
      user: {
        email: authData.user.email,
        name: profile.display_name,
        role: profile.role,
      }
    });
  } catch (error: any) {
    console.error('[Auth] Error en verify-code:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}