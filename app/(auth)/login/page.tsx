'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WavyBackground } from '@/app/components/WavyBackground';

function LoginForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar si ya está autenticado
    const isAuthenticated = document.cookie
      .split('; ')
      .find((row) => row.startsWith('admin_authenticated='))
      ?.split('=')[1] === 'true';

    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Llamar a API route para verificar el código
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      if (data.success) {
        // Redirigir a la ruta original o al dashboard
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
        router.refresh();
      } else {
        throw new Error('Código inválido');
      }
    } catch (error: any) {
      console.error('[Login] Error:', error);
      setError(error.message || 'Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className='space-y-6'>
      <div>
        <label
          htmlFor='code'
          className='block text-sm font-medium text-gray-300 mb-2'
        >
          Código de Acceso
        </label>
        <input
          id='code'
          type='text'
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className='w-full px-3 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 focus:border-[#4c87ff]/50 text-center text-lg font-mono tracking-wider text-white placeholder-gray-400'
          placeholder='INGRESA EL CÓDIGO'
          required
          disabled={loading}
          autoFocus
          autoComplete='off'
        />
      </div>

      {error && (
        <div className='p-3 bg-red-900/30 backdrop-blur-sm border border-red-500/30 rounded-md'>
          <p className='text-sm text-red-300'>{error}</p>
        </div>
      )}

      <button
        type='submit'
        disabled={loading || !code.trim()}
        className='w-full bg-[#4c87ff] text-white py-2 px-4 rounded-md hover:bg-[#3d6fe6] focus:outline-none focus:ring-2 focus:ring-[#4c87ff] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg'
      >
        {loading ? 'Verificando...' : 'Acceder al Dashboard'}
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
