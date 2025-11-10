import { NextResponse, type NextRequest } from 'next/server';

// =====================================================================
// PROXY CON AUTENTICACIÓN POR CÓDIGO
// =====================================================================
// Protege todas las rutas del dashboard excepto /login y /unauthorized
// Requiere cookie 'admin_authenticated' para acceder a rutas protegidas

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/unauthorized'];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path)
  );

  // Si es ruta pública, permitir acceso sin verificar autenticación
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verificar si tiene cookie de autenticación
  const authCookie = request.cookies.get('admin_authenticated');
  const isAuthenticated = authCookie?.value === 'true';

  // Si no está autenticado y trata de acceder a rutas protegidas, redirigir a login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Solo agregar redirect si no es la ruta de login
    if (pathname !== '/login') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Si está autenticado, permitir acceso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known (well-known files)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
