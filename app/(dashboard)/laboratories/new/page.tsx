'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewLaboratoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'active' as 'active' | 'inactive' | 'trial',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar slug (solo minúsculas, números y guiones)
      let slug = formData.name;

      const wordsName = slug.split(/\s+/);

      if (wordsName.length >= 2) {
        const firstLetter = wordsName.map((word) => word.charAt(0));
        slug = firstLetter.join('').toLowerCase();
      } else {
        slug = formData.name.toLowerCase();
      }

      const response = await fetch('/api/laboratories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: slug,
          status: 'trial',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear laboratorio');
      }

      alert('✅ Cliente creado exitosamente');
      router.push('/laboratories');
      router.refresh();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-white drop-shadow-lg'>Crear Cliente</h1>
        <p className='text-gray-200 mt-1 drop-shadow-md'>
          El cliente se creará con valores por defecto para features, branding y
          configuración
        </p>
      </div>

      <div className='bg-black/30 backdrop-blur-md p-8 rounded-lg shadow-lg max-w-2xl border border-white/10'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-200 mb-2'
            >
              Nombre del Cliente <span className='text-red-500'>*</span>
            </label>
            <input
              id='name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              placeholder='Ej: Cliente Vargas'
              required
              disabled={loading}
            />
            <p className='text-sm text-gray-300 mt-1'>
              Nombre completo del cliente
            </p>
          </div>

          <div className='bg-[#4c87ff]/10 border border-[#4c87ff]/30 rounded-lg p-4'>
            <h3 className='text-sm font-semibold text-white mb-2'>
              ℹ️ Valores por defecto
            </h3>
            <ul className='text-sm text-gray-200 space-y-1'>
              <li>• Todas las features se crearán deshabilitadas (false)</li>
              <li>
                • Branding: Logo null, color primario #0066cc, color secundario
                #00cc66
              </li>
              <li>
                • Configuración: 1 sucursal (Principal), tasa de cambio 36.5
                USD/VES
              </li>
            </ul>
            <p className='text-xs text-[#4c87ff] mt-2'>
              Puedes editar estos valores después de crear el cliente
            </p>
          </div>

          <div className='flex gap-4'>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#4c87ff]/30'
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
            <button
              type='button'
              onClick={() => router.back()}
              disabled={loading}
              className='px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 bg-black/20 backdrop-blur-sm'
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
