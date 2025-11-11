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

// PATCH: Actualizar módulo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const updateData = await request.json();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const { data, error } = await supabaseAdmin
      .from('module_catalog')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al actualizar módulo:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No se encontró el módulo' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar módulo' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar módulo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Primero obtener el módulo para saber qué feature_key eliminar
    const { data: module } = await supabaseAdmin
      .from('module_catalog')
      .select('feature_key, module_name')
      .eq('id', id)
      .single();

    if (!module) {
      return NextResponse.json(
        { error: 'No se encontró el módulo' },
        { status: 404 }
      );
    }

    // Eliminar el módulo de TODOS los laboratorios que lo tengan configurado
    const { data: labs } = await supabaseAdmin
      .from('laboratories')
      .select('id, config');

    if (labs) {
      for (const lab of labs) {
        if (lab.config?.modules?.[module.module_name]) {
          const updatedConfig = { ...lab.config };
          delete updatedConfig.modules[module.module_name];
          
          await supabaseAdmin
            .from('laboratories')
            .update({ config: updatedConfig })
            .eq('id', lab.id);
        }
      }
    }

    // Eliminar de module_catalog
    const { error } = await supabaseAdmin
      .from('module_catalog')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error al eliminar módulo:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar módulo' },
      { status: 500 }
    );
  }
}

