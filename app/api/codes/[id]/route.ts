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

// PATCH: Actualizar código
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const updateData = await request.json();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // ===== OBTENER CÓDIGO ACTUAL =====
    const { data: currentCode, error: fetchError } = await supabaseAdmin
      .from('laboratory_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentCode) {
      return NextResponse.json(
        { error: 'No se encontró el código' },
        { status: 404 }
      );
    }

    // ===== VALIDACIÓN 1: Proteger current_uses (solo modificable por RPC) =====
    if (updateData.current_uses !== undefined && updateData.current_uses !== currentCode.current_uses) {
      return NextResponse.json(
        { error: 'current_uses no puede modificarse manualmente. Solo se incrementa automáticamente al usar el código.' },
        { status: 403 }
      );
    }

    // ===== VALIDACIÓN 2: Proteger laboratory_id (no se puede cambiar) =====
    if (updateData.laboratory_id && updateData.laboratory_id !== currentCode.laboratory_id) {
      return NextResponse.json(
        { error: 'No se puede cambiar el laboratorio de un código existente' },
        { status: 403 }
      );
    }

    // ===== VALIDACIÓN 3: max_uses debe ser >= current_uses =====
    if (updateData.max_uses !== null && updateData.max_uses !== undefined) {
      const newMaxUses = parseInt(updateData.max_uses);
      
      if (isNaN(newMaxUses) || newMaxUses < 1 || !Number.isInteger(newMaxUses)) {
        return NextResponse.json(
          { error: 'max_uses debe ser un número entero mayor a 0' },
          { status: 400 }
        );
      }

      if (newMaxUses < currentCode.current_uses) {
        return NextResponse.json(
          { error: `max_uses (${newMaxUses}) no puede ser menor que current_uses actual (${currentCode.current_uses})` },
          { status: 400 }
        );
      }

      updateData.max_uses = newMaxUses;
    }

    // ===== VALIDACIÓN 4: expires_at debe ser fecha futura =====
    if (updateData.expires_at) {
      const expirationDate = new Date(updateData.expires_at);
      const now = new Date();
      
      if (isNaN(expirationDate.getTime())) {
        return NextResponse.json(
          { error: 'expires_at no es una fecha válida' },
          { status: 400 }
        );
      }
      
      if (expirationDate <= now) {
        return NextResponse.json(
          { error: 'expires_at debe ser una fecha futura' },
          { status: 400 }
        );
      }
    }

    // ===== VALIDACIÓN 5: Formato del código si se actualiza =====
    if (updateData.code) {
      const code = updateData.code.trim().toUpperCase();
      
      if (code.length === 0) {
        return NextResponse.json(
          { error: 'El código no puede estar vacío' },
          { status: 400 }
        );
      }
      
      if (code.length > 50) {
        return NextResponse.json(
          { error: 'El código no puede tener más de 50 caracteres' },
          { status: 400 }
        );
      }
      
      updateData.code = code;
    }

    // ===== ACTUALIZAR CÓDIGO =====
    const { data, error } = await supabaseAdmin
      .from('laboratory_codes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al actualizar código:', error);
      
      // Manejar error de código duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un código con ese nombre' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    console.log('✅ Código actualizado:', id);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar código' },
      { status: 500 }
    );
  }
}

