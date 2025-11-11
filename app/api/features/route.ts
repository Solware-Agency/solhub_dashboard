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

// POST: Crear nueva feature
export async function POST(request: NextRequest) {
  try {
    const insertData = await request.json();

    // Validar datos requeridos
    if (!insertData.key || !insertData.name) {
      return NextResponse.json(
        { error: 'key y name son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('feature_catalog')
      .insert({
        ...insertData,
        is_active: true,
        default_value: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al crear feature:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear feature' },
      { status: 500 }
    );
  }
}

