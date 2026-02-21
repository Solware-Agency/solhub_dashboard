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

// GET: Listar módulos del catálogo (evita RLS en cliente; uso con service_role)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('module_catalog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al listar módulos:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar módulos' },
      { status: 500 }
    );
  }
}

// POST: Crear módulo
export async function POST(request: NextRequest) {
  try {
    const insertData = await request.json();

    const { data, error } = await supabaseAdmin
      .from('module_catalog')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al crear módulo:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear módulo' },
      { status: 500 }
    );
  }
}

