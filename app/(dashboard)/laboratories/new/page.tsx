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
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.slug)) {
        throw new Error(
          'El slug solo puede contener letras minúsculas, números y guiones',
        );
      }

      const { error } = await supabase.from('laboratories').insert({
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
      });

      if (error) throw error;

      alert('✅ Laboratorio creado exitosamente');
      router.push('/laboratories');
      router.refresh();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Convertir a lowercase y reemplazar espacios por guiones
    const slug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug });
  };

  return (
    <div>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Crear Laboratorio</h1>
        <p className='text-gray-600 mt-1'>
          El laboratorio se creará con valores por defecto para features,
          branding y configuración
        </p>
      </div>

      <div className='bg-white p-8 rounded-lg shadow max-w-2xl'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Nombre del Laboratorio <span className='text-red-500'>*</span>
            </label>
            <input
              id='name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Ej: Laboratorio Vargas'
              required
              disabled={loading}
            />
            <p className='text-sm text-gray-500 mt-1'>
              Nombre completo del laboratorio
            </p>
          </div>

          <div>
            <label
              htmlFor='slug'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Slug (identificador único) <span className='text-red-500'>*</span>
            </label>
            <input
              id='slug'
              type='text'
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Ej: labvargas'
              pattern='[a-z0-9-]+'
              required
              disabled={loading}
            />
            <p className='text-sm text-gray-500 mt-1'>
              Solo letras minúsculas, números y guiones. Este será usado para
              identificar al laboratorio en el sistema.
            </p>
          </div>

          <div>
            <label
              htmlFor='status'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Estado <span className='text-red-500'>*</span>
            </label>
            <select
              id='status'
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={loading}
            >
              <option value='active'>Activo</option>
              <option value='inactive'>Inactivo</option>
              <option value='trial'>Prueba</option>
            </select>
            <p className='text-sm text-gray-500 mt-1'>
              Estado inicial del laboratorio
            </p>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h3 className='text-sm font-semibold text-blue-900 mb-2'>
              ℹ️ Valores por defecto
            </h3>
            <ul className='text-sm text-blue-800 space-y-1'>
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
            <p className='text-xs text-blue-700 mt-2'>
              Puedes editar estos valores después de crear el laboratorio
            </p>
          </div>

          <div className='flex gap-4'>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? 'Creando...' : 'Crear Laboratorio'}
            </button>
            <button
              type='button'
              onClick={() => router.back()}
              disabled={loading}
              className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
