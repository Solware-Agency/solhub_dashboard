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

// PATCH: Actualizar feature
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const updateData = await request.json();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const { data, error } = await supabaseAdmin
      .from('feature_catalog')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al actualizar feature:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No se encontró la feature' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar feature' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar feature
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Primero obtener la feature para saber qué key eliminar
    const { data: feature } = await supabaseAdmin
      .from('feature_catalog')
      .select('key')
      .eq('id', id)
      .single();

    if (!feature) {
      return NextResponse.json(
        { error: 'No se encontró la feature' },
        { status: 404 }
      );
    }

    // Eliminar la feature de TODOS los laboratorios
    const { data: labs } = await supabaseAdmin
      .from('laboratories')
      .select('id, features');

    if (labs) {
      for (const lab of labs) {
        const updatedFeatures = { ...lab.features };
        delete updatedFeatures[feature.key as keyof typeof updatedFeatures];

        await supabaseAdmin
          .from('laboratories')
          .update({ features: updatedFeatures })
          .eq('id', lab.id);
      }
    }

    // Eliminar de feature_catalog
    const { error } = await supabaseAdmin
      .from('feature_catalog')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error al eliminar feature:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar feature' },
      { status: 500 }
    );
  }
}

