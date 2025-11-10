'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/laboratories', label: 'Clientes', icon: '🏥' },
  { href: '/features', label: 'Features', icon: '🚩' },
  { href: '/types-generator', label: 'Generador de Tipos', icon: '📝' },
  { href: '/codes', label: 'Códigos de Acceso', icon: '🔑' },
  { href: '/users', label: 'Usuarios Global', icon: '👥' },
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
    <div className='flex h-screen bg-gray-100'>
      {/* Sidebar */}
      <aside className='w-64 bg-white shadow-md flex flex-col'>
        <div className='p-6 border-b'>
          <h1 className='text-2xl font-bold text-gray-900'>Solhub Admin</h1>
          <p className='text-sm text-gray-500 mt-1'>Dashboard Administrativo</p>
        </div>

        <nav className='flex-1 p-4 space-y-1'>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
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
                <span className='text-xl'>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className='p-4 border-t'>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className='w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoggingOut ? 'Cerrando sesión...' : '🚪 Cerrar Sesión'}
          </button>
          <div className='px-4 py-2 text-center text-xs text-gray-500 mt-2'>
            Solhub Admin Dashboard
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-auto'>
        <div className='p-8'>{children}</div>
      </main>
    </div>
  );
}
