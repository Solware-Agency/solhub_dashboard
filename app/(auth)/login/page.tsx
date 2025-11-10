'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Código de Acceso
        </label>
        <input
          id='code'
          type='text'
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-wider text-black'
          placeholder='INGRESA EL CÓDIGO'
          required
          disabled={loading}
          autoFocus
          autoComplete='off'
        />
        <p className='mt-2 text-xs text-gray-500'>
          Ingresa el código de acceso para continuar
        </p>
      </div>

      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      <button
        type='submit'
        disabled={loading || !code.trim()}
        className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {loading ? 'Verificando...' : 'Acceder al Dashboard'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full p-8 bg-white rounded-lg shadow-md'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Solhub Admin</h1>
          <p className='text-gray-600 mt-2'>Dashboard Administrativo</p>
        </div>

        <Suspense
          fallback={
            <div className='text-center text-gray-600 py-8'>
              Cargando formulario...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className='mt-6 text-center text-sm text-gray-500'>
          Panel exclusivo para administradores de Solhub
        </p>
      </div>
    </div>
  );
}
