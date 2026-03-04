import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Cliente con service_role_key (SOLO EN SERVIDOR) - fallback cuando no hay sesión
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

// DELETE: Eliminar usuario de auth.users (y CASCADE en profiles) vía RPC
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Preferir cliente con sesión del usuario para que la RPC vea auth.uid() (owner, mismo lab)
    let supabase = supabaseAdmin;
    const cookieStore = await cookies();
    const serverClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );
    const { data: { session } } = await serverClient.auth.getSession();
    if (session?.access_token) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${session.access_token}` } },
        }
      );
    }

    const { data, error } = await supabase.rpc('delete_user_from_auth', {
      p_user_id: userId,
    });

    if (error) {
      console.error('❌ Error RPC delete_user_from_auth:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = data as { success?: boolean; error?: string; message?: string } | null;
    if (!result) {
      return NextResponse.json(
        { error: 'Respuesta inválida del servidor' },
        { status: 500 }
      );
    }

    if (result.success === false) {
      const msg = result.error || 'Error al eliminar usuario';
      const status = msg.includes('No puedes') || msg.includes('Solo los') ? 403 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json(
      { success: true, message: result.message || 'Usuario eliminado correctamente' },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('❌ Error inesperado en DELETE user:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}

// PUT/PATCH: Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updateData = await request.json();
    const { id: userId } = await params;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('*, laboratory:laboratories(name, slug)')
      .single();

    if (error) {
      console.error('❌ Error al actualizar usuario:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
