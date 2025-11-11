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

// POST: Crear nuevo laboratorio
export async function POST(request: NextRequest) {
  try {
    const insertData = await request.json();

    // Validar datos requeridos
    if (!insertData.name || !insertData.slug) {
      return NextResponse.json(
        { error: 'name y slug son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('laboratories')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al crear laboratorio:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear laboratorio' },
      { status: 500 }
    );
  }
}

