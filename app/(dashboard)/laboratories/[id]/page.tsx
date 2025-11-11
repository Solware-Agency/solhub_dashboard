'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Laboratory } from '@/lib/types/database';
import { Edit, ClipboardList, Flag, Trash2 } from 'lucide-react';

export default function LaboratoryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadLaboratory();
  }, [params.id]);

  const loadLaboratory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('laboratories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!error && data) {
      setLaboratory(data);
    } else {
      alert('❌ Error al cargar cliente');
      router.push('/laboratories');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!laboratory) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/laboratories/${laboratory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar laboratorio');
      }

      alert('✅ Cliente eliminado exitosamente');
      router.push('/laboratories');
      router.refresh();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setDeleting(false);
    }
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
    return <div className='text-gray-600'>Cargando detalles...</div>;
  }

  if (!laboratory) {
    return <div className='text-red-600'>Cliente no encontrado</div>;
  }

  const featuresArray = Object.entries(laboratory.features || {});
  const enabledFeatures = featuresArray.filter(([_, value]) => value === true);

  return (
    <div>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
          <Link href='/laboratories' className='hover:text-blue-600'>
            Clientes
          </Link>
          <span>/</span>
          <span className='text-gray-900'>{laboratory.name}</span>
        </div>
        <div className='flex justify-between items-start'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {laboratory.name}
            </h1>
            <div className='flex items-center gap-3 mt-2'>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                  laboratory.status,
                )}`}
              >
                {laboratory.status}
              </span>
              <span className='text-sm text-gray-500'>
                Creado:{' '}
                {new Date(laboratory.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
          <div className='flex gap-3'>
            <Link
              href={`/laboratories/${laboratory.id}/edit`}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1'
            >
              <Edit className='w-4 h-4' />
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1'
            >
              <Trash2 className='w-4 h-4' />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Detalles */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Información Básica */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <ClipboardList className='w-5 h-5' />
            Información Básica
          </h2>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-500'>ID</label>
              <p className='text-sm font-mono bg-gray-50 px-2 py-1 rounded mt-1 text-gray-600'>
                {laboratory.id}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>Slug</label>
              <p className='text-sm font-mono bg-gray-50 px-2 py-1 rounded mt-1 text-gray-600'>
                {laboratory.slug}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Nombre
              </label>
              <p className='text-sm mt-1 text-gray-600'>{laboratory.name}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Estado
              </label>
              <p className='text-sm mt-1 capitalize text-gray-600'>
                {laboratory.status}
              </p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            🎨 Branding
          </h2>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-500'>Logo</label>
              <p className='text-sm mt-1 text-gray-600'>
                {laboratory.branding?.logo || (
                  <span className='text-gray-400 italic'>No configurado</span>
                )}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>Ícono</label>
              <p className='text-sm mt-1 text-gray-600'>
                {laboratory.branding?.icon || 'solhub'}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Color Primario
              </label>
              <div className='flex items-center gap-2 mt-1'>
                <div
                  className='w-8 h-8 rounded border border-gray-300'
                  style={{ backgroundColor: laboratory.branding?.primaryColor }}
                />
                <span className='text-sm font-mono text-gray-600'>
                  {laboratory.branding?.primaryColor}
                </span>
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Color Secundario
              </label>
              <div className='flex items-center gap-2 mt-1'>
                <div
                  className='w-8 h-8 rounded border border-gray-300'
                  style={{
                    backgroundColor: laboratory.branding?.secondaryColor,
                  }}
                />
                <span className='text-sm font-mono text-gray-600'>
                  {laboratory.branding?.secondaryColor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Flag className='w-5 h-5' />
            Features Habilitadas
            <span className='text-sm font-normal text-gray-500'>
              ({enabledFeatures.length} de {featuresArray.length})
            </span>
          </h2>
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {featuresArray.map(([key, value]) => (
              <div
                key={key}
                className='flex items-center justify-between py-2 border-b border-gray-100 last:border-0'
              >
                <span className='text-sm font-mono text-gray-700'>{key}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    value
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {value ? '✓ Habilitado' : '○ Deshabilitado'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuración */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            ⚙️ Configuración
          </h2>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Sucursales
              </label>
              <div className='mt-1 flex flex-wrap gap-1'>
                {laboratory.config?.branches?.map(
                  (branch: string, i: number) => (
                    <span
                      key={i}
                      className='px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs'
                    >
                      {branch}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Métodos de Pago
              </label>
              <div className='mt-1 flex flex-wrap gap-1'>
                {laboratory.config?.paymentMethods?.map(
                  (method: string, i: number) => (
                    <span
                      key={i}
                      className='px-2 py-1 bg-green-50 text-green-700 rounded text-xs'
                    >
                      {method}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Tasa de Cambio
              </label>
              <p className='text-sm mt-1 text-gray-600'>
                {laboratory.config?.defaultExchangeRate} USD/VES
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                Zona Horaria
              </label>
              <p className='text-sm mt-1 text-gray-600'>
                {laboratory.config?.timezone}
              </p>
            </div>
            {laboratory.config?.webhooks && (
              <div>
                <label className='text-sm font-medium text-gray-500'>
                  Webhooks
                </label>
                <div className='mt-1 space-y-1 text-xs font-mono bg-gray-50 p-2 rounded'>
                  {Object.entries(laboratory.config.webhooks).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className='text-gray-600'>{key}:</span>{' '}
                        <span className='text-blue-600'>{value as string}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Confirmar Eliminación */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              ⚠️ Confirmar Eliminación
            </h3>
            <p className='text-gray-600 mb-4'>
              ¿Estás seguro de eliminar el cliente{' '}
              <strong>{laboratory.name}</strong>?
            </p>
            <p className='text-sm text-red-600 mb-6'>
              Esta acción eliminará TODOS los datos asociados al cliente
              (usuarios, pacientes, casos, etc.) y no se puede deshacer.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
