'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Flag,
  FileCode,
  Key,
  Users,
  LogOut,
  Package,
} from 'lucide-react';

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

  return (
    <div className='flex h-screen bg-gray-100 overflow-hidden'>
      {/* Sidebar */}
      <aside className='w-64 bg-white shadow-md flex flex-col overflow-hidden'>
        <div className='p-6 border-b shrink-0'>
          <img
            src='https://lafysstpyiejevhrlmzc.supabase.co/storage/v1/object/public/imagenes/Logos/SolHub/SolHub_ORIG%20-%20SIN%20ESLOGAN.svg'
            alt='Solhub Admin'
            className='w-full h-auto max-h-16 object-contain'
          />
        </div>

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
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className='w-5 h-5' />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className='p-4 border-t shrink-0'>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className='w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            <LogOut className='w-4 h-4' />
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-hidden flex flex-col'>
        <div className='flex-1 overflow-y-auto overflow-x-visible relative'>
          <div className='p-8'>{children}</div>
        </div>
      </main>
    </div>
  );
}
