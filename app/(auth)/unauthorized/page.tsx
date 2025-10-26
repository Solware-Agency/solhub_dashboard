'use client';

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center'>
        <div className='mb-6'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>🚫</span>
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Acceso Denegado
          </h1>
          <p className='text-gray-600'>
            No tienes permisos para acceder al dashboard administrativo de
            Solhub.
          </p>
        </div>

        <div className='space-y-3'>
          <button
            onClick={handleLogout}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors'
          >
            Volver al Login
          </button>

          <p className='text-sm text-gray-500'>
            Si crees que esto es un error, contacta al administrador del
            sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
