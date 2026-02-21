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

// GET: Listar códigos con laboratorio (evita RLS en cliente; uso con service_role)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('laboratory_codes')
      .select('*, laboratory:laboratories(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al listar códigos:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar códigos' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo código
export async function POST(request: NextRequest) {
  try {
    const insertData = await request.json();

    // Validar datos requeridos
    if (!insertData.laboratory_id || !insertData.code) {
      return NextResponse.json(
        { error: 'laboratory_id y code son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('laboratory_codes')
      .insert({
        ...insertData,
        is_active: insertData.is_active ?? true,
        current_uses: 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al crear código:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear código' },
      { status: 500 }
    );
  }
}

