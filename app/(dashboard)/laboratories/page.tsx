'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Laboratory } from '@/lib/types/database';

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'trial'>(
    'all',
  );

  useEffect(() => {
    loadLaboratories();
  }, [filter]);

  const loadLaboratories = async () => {
    setLoading(true);
    let query = supabase
      .from('laboratories')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLaboratories(data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      trial: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  if (loading) {
    return <div className='text-gray-600'>Cargando laboratorios...</div>;
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Laboratorios</h1>
          <p className='text-gray-600 mt-1'>
            Gestiona todos los laboratorios del sistema
          </p>
        </div>
        <Link
          href='/laboratories/new'
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          + Crear Laboratorio
        </Link>
      </div>

      {/* Filtros */}
      <div className='mb-6 flex gap-2'>
        {(['all', 'active', 'inactive', 'trial'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {status === 'all'
              ? 'Todos'
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla de Laboratorios */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Nombre
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Slug
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Estado
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Fecha Creación
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {laboratories.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-8 text-center text-gray-500'>
                  No hay laboratorios{' '}
                  {filter !== 'all' && `con estado "${filter}"`}
                </td>
              </tr>
            ) : (
              laboratories.map((lab) => (
                <tr key={lab.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>
                      {lab.name}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-500'>{lab.slug}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        lab.status,
                      )}`}
                    >
                      {lab.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {new Date(lab.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <Link
                      href={`/laboratories/${lab.id}`}
                      className='text-blue-600 hover:text-blue-900 mr-4'
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/laboratories/${lab.id}/edit`}
                      className='text-blue-600 hover:text-blue-900'
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className='mt-4 text-sm text-gray-600'>
        Total: <span className='font-semibold'>{laboratories.length}</span>{' '}
        laboratorio
        {laboratories.length !== 1 && 's'}
      </p>
    </div>
  );
}
