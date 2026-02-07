import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// GET: Obtener todos los usuarios con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const laboratoryId = searchParams.get('laboratory_id');
    const role = searchParams.get('role');
    const estado = searchParams.get('estado');

    let query = supabaseAdmin
      .from('profiles')
      .select('*, laboratory:laboratories(name, slug)')
      .order('created_at', { ascending: false });

    // Aplicar filtros si existen
    if (laboratoryId && laboratoryId !== 'all') {
      query = query.eq('laboratory_id', laboratoryId);
    }

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (estado && estado !== 'all') {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

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
