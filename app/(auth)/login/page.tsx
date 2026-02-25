'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WavyBackground } from '@/app/components/WavyBackground';
import { supabase } from '@/lib/supabase/client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar si ya está autenticado con Supabase
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    };
    checkAuth();
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[Login] Iniciando login con:', email);
      
      // Llamar a API route para autenticar con email y password
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[Login] Response status:', response.status);
      
      const data = await response.json();
      console.log('[Login] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      if (data.success && data.session) {
        console.log('[Login] Estableciendo sesión...');
        
        // Establecer la sesión en el cliente de Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          console.error('[Login] Error al establecer sesión:', sessionError);
          throw new Error('Error al establecer la sesión');
        }

        console.log('[Login] Sesión establecida correctamente');
        
        // Redirigir a la ruta original o al dashboard
        const redirect = searchParams.get('redirect') || '/';
        console.log('[Login] Redirigiendo a:', redirect);
        
        router.push(redirect);
        router.refresh();
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (error: any) {
      console.error('[Login] Error:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className='space-y-6'>
      <div>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-300 mb-2'
        >
          Email
        </label>
        <input
          id='email'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 focus:border-[#4c87ff]/50 text-white placeholder-gray-400'
          placeholder='tu@email.com'
          required
          disabled={loading}
          autoFocus
          autoComplete='email'
        />
      </div>

      <div>
        <label
          htmlFor='password'
          className='block text-sm font-medium text-gray-300 mb-2'
        >
          Contraseña
        </label>
        <input
          id='password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 focus:border-[#4c87ff]/50 text-white placeholder-gray-400'
          placeholder='••••••••'
          required
          disabled={loading}
          autoComplete='current-password'
        />
      </div>

      {error && (
        <div className='p-3 bg-red-900/30 backdrop-blur-sm border border-red-500/30 rounded-md'>
          <p className='text-sm text-red-300'>{error}</p>
        </div>
      )}

      <button
        type='submit'
        disabled={loading || !email.trim() || !password.trim()}
        className='w-full bg-[#4c87ff] text-white py-2 px-4 rounded-md hover:bg-[#3d6fe6] focus:outline-none focus:ring-2 focus:ring-[#4c87ff] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg'
      >
        {loading ? 'Iniciando sesión...' : 'Acceder al Dashboard'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <WavyBackground
      colors={['#41e2b8', '#4c87ff', '#29536b', '#07004d']}
      waveOpacity={0.5}
      blur={10}
      speed="fast"
      containerClassName="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden w-full max-w-[100vw]"
    >
      <div className='max-w-md w-full p-4 sm:p-6 md:p-8 bg-black/30 backdrop-blur-md rounded-lg shadow-lg border border-white/10'>
        <div className='text-center mb-8 relative'>
          <div className='relative flex items-center justify-center mb-4'>
            <div
              className='absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse'
              style={{
                width: '120px',
                height: '120px',
                margin: '0 auto',
              }}
            ></div>
            <div className='relative z-10'>
              <img
                src='https://lafysstpyiejevhrlmzc.supabase.co/storage/v1/object/public/imagenes/Logos/SolHub/ISOTIPO/SolHub_ISOTIPO_ORIG.svg'
                alt='Solhub Logo'
                className='h-24 w-auto mx-auto'
              />
            </div>
          </div>
          <p className='text-white mt-4 text-lg font-semibold'>Panel Administrativo de Solhub</p>
        </div>

        <Suspense
          fallback={
            <div className='text-center text-gray-300 py-8'>
              Cargando formulario...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className='mt-6 text-center text-sm text-gray-400'>
          Panel exclusivo para administradores de Solhub
        </p>
      </div>
    </WavyBackground>
  );
}
