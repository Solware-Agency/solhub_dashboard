import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código requerido' },
        { status: 400 }
      );
    }

    // Obtener el código del .env
    const adminCode = process.env.ADMIN_ACCESS_CODE;

    if (!adminCode) {
      console.error('[Auth] ADMIN_ACCESS_CODE no está configurado en .env');
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Verificar el código (comparación case-insensitive)
    const isValid = code.trim().toUpperCase() === adminCode.trim().toUpperCase();

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Código inválido' },
        { status: 401 }
      );
    }

    // Establecer cookie de autenticación persistente (válida hasta cerrar sesión o pestaña)
    // Usamos una expiración muy lejana (1 año) para que sea efectivamente persistente
    const cookieStore = await cookies();
    cookieStore.set('admin_authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 año (efectivamente persistente)
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Auth] Error en verify-code:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

