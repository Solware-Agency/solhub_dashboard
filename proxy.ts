import { NextResponse, type NextRequest } from 'next/server';

// =====================================================================
// proxy DESHABILITADO - Dashboard sin autenticación
// =====================================================================
// El dashboard es accesible directamente sin login
// Si en el futuro necesitas habilitar auth, descomentar el código anterior

export async function proxy(request: NextRequest) {
  // Simplemente dejar pasar todas las solicitudes sin verificación
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
