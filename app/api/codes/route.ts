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

    // ===== VALIDACIÓN 1: Campos requeridos =====
    if (!insertData.laboratory_id || !insertData.code) {
      return NextResponse.json(
        { error: 'laboratory_id y code son requeridos' },
        { status: 400 }
      );
    }

    // ===== VALIDACIÓN 2: Formato del código =====
    const code = insertData.code.trim().toUpperCase();
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

    // ===== VALIDACIÓN 3: max_uses debe ser > 0 =====
    if (insertData.max_uses !== null && insertData.max_uses !== undefined) {
      const maxUses = parseInt(insertData.max_uses);
      if (isNaN(maxUses) || maxUses < 1 || !Number.isInteger(maxUses)) {
        return NextResponse.json(
          { error: 'max_uses debe ser un número entero mayor a 0' },
          { status: 400 }
        );
      }
      insertData.max_uses = maxUses;
    }

    // ===== VALIDACIÓN 4: expires_at debe ser fecha futura =====
    if (insertData.expires_at) {
      const expirationDate = new Date(insertData.expires_at);
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

    // ===== VALIDACIÓN 5: Verificar que laboratory_id existe =====
    const { data: laboratory, error: labError } = await supabaseAdmin
      .from('laboratories')
      .select('id, name')
      .eq('id', insertData.laboratory_id)
      .single();

    if (labError || !laboratory) {
      return NextResponse.json(
        { error: 'El laboratorio especificado no existe' },
        { status: 400 }
      );
    }

    // ===== INSERTAR CÓDIGO CON VALIDACIONES APLICADAS =====
    const { data, error } = await supabaseAdmin
      .from('laboratory_codes')
      .insert({
        laboratory_id: insertData.laboratory_id,
        code: code, // Ya está trimmed y uppercase
        max_uses: insertData.max_uses || null,
        expires_at: insertData.expires_at || null,
        is_active: insertData.is_active ?? true,
        current_uses: 0, // Siempre comienza en 0
        created_by: insertData.created_by || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error al crear código:', error);
      
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

    console.log('✅ Código creado:', code, 'para laboratorio:', laboratory.name);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear código' },
      { status: 500 }
    );
  }
}

