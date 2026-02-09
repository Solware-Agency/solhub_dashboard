'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Flag,
  FileCode,
  Key,
  Users,
  LogOut,
  Package,
  Menu,
  X,
} from 'lucide-react';
import { WavyBackground } from '@/app/components/WavyBackground';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/laboratories', label: 'Clientes', icon: Building2 },
  { href: '/features', label: 'Features', icon: Flag },
  { href: '/modules', label: 'Módulos', icon: Package },
  { href: '/types-generator', label: 'Generador de Tipos', icon: FileCode },
  { href: '/codes', label: 'Códigos de Acceso', icon: Key },
  { href: '/users', label: 'Usuarios Global', icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const logoUrl =
    'https://lafysstpyiejevhrlmzc.supabase.co/storage/v1/object/public/imagenes/Logos/SolHub/solhubL.webp';

  const sidebarContent = (
    <>
      <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#4c87ff]/20 text-[#4c87ff] font-medium border border-[#4c87ff]/30'
                  : 'text-gray-300 hover:bg-black/40 hover:text-white'
              }`}
            >
              <IconComponent className='w-5 h-5 shrink-0' />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className='p-4 border-t border-white/10 shrink-0'>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className='w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-red-500/30'
        >
          <LogOut className='w-4 h-4 shrink-0' />
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
        </button>
      </div>
    </>
  );

  return (
    <WavyBackground
      colors={['#41e2b8', '#4c87ff', '#29536b', '#07004d']}
      waveOpacity={0.5}
      blur={10}
      speed="fast"
      containerClassName="h-screen h-[100dvh] overflow-hidden w-full max-w-[100vw]"
      className="w-full h-full min-w-0 max-w-full overflow-x-hidden"
    >
      <div className='flex h-full w-full max-w-[100vw] relative z-10 min-w-0 overflow-x-hidden'>
        {/* Sidebar desktop */}
        <aside className='hidden md:flex w-64 shrink-0 bg-black/30 backdrop-blur-md shadow-lg flex-col overflow-hidden border-r border-white/10'>
          <div className='p-4 sm:p-6 border-b border-white/10 shrink-0'>
            <img src={logoUrl} alt='Solhub Admin' className='w-full h-auto max-h-14 sm:max-h-16 object-contain' />
          </div>
          {sidebarContent}
        </aside>

        {/* Overlay móvil */}
        {mobileMenuOpen && (
          <button
            type='button'
            aria-label='Cerrar menú'
            className='fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden'
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar móvil (drawer) */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 max-w-[85vw] bg-black/95 backdrop-blur-md shadow-xl flex flex-col border-r border-white/10 transition-transform duration-200 ease-out md:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className='flex items-center justify-between p-4 border-b border-white/10'>
            <img src={logoUrl} alt='Solhub' className='h-8 w-auto object-contain' />
            <button
              type='button'
              aria-label='Cerrar menú'
              className='p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white'
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className='w-5 h-5' />
            </button>
          </div>
          <div className='flex-1 overflow-y-auto'>
            {sidebarContent}
          </div>
        </aside>

        {/* Main Content */}
        <main className='flex-1 min-w-0 overflow-y-hidden overflow-x-visible flex flex-col max-w-full'>
          <header className='md:hidden shrink-0 flex items-center justify-between gap-2 px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10'>
            <button
              type='button'
              aria-label='Abrir menú'
              className='p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white'
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className='w-6 h-6' />
            </button>
            <img src={logoUrl} alt='Solhub' className='h-7 w-auto object-contain' />
            <div className='w-10' />
          </header>
          <div className='flex-1 overflow-y-auto overflow-x-visible relative min-w-0'>
            <div className='p-4 sm:p-6 lg:p-8 min-w-0 max-w-full'>{children}</div>
          </div>
        </main>
      </div>
    </WavyBackground>
  );
}
