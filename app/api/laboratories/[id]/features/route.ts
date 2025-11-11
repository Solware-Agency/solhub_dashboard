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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { features } = await request.json();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!features || typeof features !== 'object') {
      return NextResponse.json(
        { error: 'features debe ser un objeto' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('laboratories')
      .update({ features })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al actualizar features:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No se encontró el laboratorio' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar features' },
      { status: 500 }
    );
  }
}

