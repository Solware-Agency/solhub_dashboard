'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[Login] Intentando login con:', email);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[Login] Error en signIn:', signInError);
        throw signInError;
      }

      console.log('[Login] SignIn exitoso, verificando usuario...');

      // Verificar que el usuario sea super admin
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('[Login] Usuario obtenido:', user?.id);

      if (user) {
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('[Login] AdminUser query:', { adminUser, adminError });

        if (!adminUser || !adminUser.is_active) {
          console.error('[Login] Usuario no es admin o no está activo');
          await supabase.auth.signOut();
          throw new Error(
            'No tienes permisos para acceder al dashboard administrativo',
          );
        }

        console.log('[Login] Usuario autorizado, redirigiendo...');
      }

      console.log('[Login] Ejecutando router.push("/")');
      router.push('/');
      router.refresh();
      console.log('[Login] Redirección completada');
    } catch (error: any) {
      console.error('[Login] Error en handleLogin:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full p-8 bg-white rounded-lg shadow-md'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Solhub Admin</h1>
          <p className='text-gray-600 mt-2'>Dashboard Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className='space-y-6'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='admin@solhub.app'
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Contraseña
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='••••••••'
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className='mt-6 text-center text-sm text-gray-500'>
          Panel exclusivo para administradores de Solhub
        </p>
      </div>
    </div>
  );
}
