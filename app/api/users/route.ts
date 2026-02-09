import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente con service_role_key (SOLO EN SERVIDOR)
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

// GET: Obtener todos los usuarios
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        laboratory:laboratories(name, slug)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener usuarios:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
