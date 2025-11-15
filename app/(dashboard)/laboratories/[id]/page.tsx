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
    const loadLaboratory = async () => {
      const id = params.id as string;
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('laboratories')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setLaboratory(data);
        } else {
          alert('❌ Error al cargar cliente');
          router.push('/laboratories');
        }
      } catch (error) {
        console.error('Error loading laboratory:', error);
        alert('❌ Error al cargar cliente');
        router.push('/laboratories');
      } finally {
        setLoading(false);
      }
    };

    loadLaboratory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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
    return <div className='text-gray-200'>Cargando detalles...</div>;
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
        <div className='flex items-center gap-2 text-sm text-gray-300 mb-2'>
          <Link href='/laboratories' className='hover:text-[#4c87ff]'>
            Clientes
          </Link>
          <span>/</span>
          <span className='text-white'>{laboratory.name}</span>
        </div>
        <div className='flex justify-between items-start'>
          <div>
            <h1 className='text-3xl font-bold text-white drop-shadow-lg'>
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
              <span className='text-sm text-gray-300'>
                Creado:{' '}
                {new Date(laboratory.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
          <div className='flex gap-3'>
            <Link
              href={`/laboratories/${laboratory.id}/edit`}
              className='px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] transition-colors flex items-center gap-1 shadow-lg shadow-[#4c87ff]/30'
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
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            <ClipboardList className='w-5 h-5' />
            Información Básica
          </h2>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-200'>ID</label>
              <p className='text-sm font-mono bg-black/20 backdrop-blur-sm px-2 py-1 rounded mt-1 text-gray-300 border border-white/10'>
                {laboratory.id}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>Slug</label>
              <p className='text-sm font-mono bg-black/20 backdrop-blur-sm px-2 py-1 rounded mt-1 text-gray-300 border border-white/10'>
                {laboratory.slug}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Nombre
              </label>
              <p className='text-sm mt-1 text-white'>{laboratory.name}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Estado
              </label>
              <p className='text-sm mt-1 capitalize text-white'>
                {laboratory.status}
              </p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            🎨 Branding
          </h2>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-200'>Logo</label>
              <p className='text-sm mt-1 text-white'>
                {laboratory.branding?.logo || (
                  <span className='text-gray-400 italic'>No configurado</span>
                )}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>Ícono</label>
              <p className='text-sm mt-1 text-white'>
                {laboratory.branding?.icon || 'solhub'}
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Color Primario
              </label>
              <div className='flex items-center gap-2 mt-1'>
                <div
                  className='w-8 h-8 rounded border border-white/20'
                  style={{ backgroundColor: laboratory.branding?.primaryColor }}
                />
                <span className='text-sm font-mono text-white'>
                  {laboratory.branding?.primaryColor}
                </span>
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Color Secundario
              </label>
              <div className='flex items-center gap-2 mt-1'>
                <div
                  className='w-8 h-8 rounded border border-white/20'
                  style={{
                    backgroundColor: laboratory.branding?.secondaryColor,
                  }}
                />
                <span className='text-sm font-mono text-white'>
                  {laboratory.branding?.secondaryColor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            <Flag className='w-5 h-5' />
            Features Habilitadas
            <span className='text-sm font-normal text-gray-300'>
              ({enabledFeatures.length} de {featuresArray.length})
            </span>
          </h2>
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {featuresArray.map(([key, value]) => (
              <div
                key={key}
                className='flex items-center justify-between py-2 border-b border-white/10 last:border-0'
              >
                <span className='text-sm font-mono text-white'>{key}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    value
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {value ? '✓ Habilitado' : '○ Deshabilitado'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuración */}
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            ⚙️ Configuración
          </h2>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Sucursales
              </label>
              <div className='mt-1 flex flex-wrap gap-1'>
                {laboratory.config?.branches?.map(
                  (branch: string, i: number) => (
                    <span
                      key={i}
                      className='px-2 py-1 bg-[#4c87ff]/20 text-[#4c87ff] rounded text-xs border border-[#4c87ff]/30'
                    >
                      {branch}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Métodos de Pago
              </label>
              <div className='mt-1 flex flex-wrap gap-1'>
                {laboratory.config?.paymentMethods?.map(
                  (method: string, i: number) => (
                    <span
                      key={i}
                      className='px-2 py-1 bg-[#41e2b8]/20 text-[#41e2b8] rounded text-xs border border-[#41e2b8]/30'
                    >
                      {method}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Tasa de Cambio
              </label>
              <p className='text-sm mt-1 text-white'>
                {laboratory.config?.defaultExchangeRate} USD/VES
              </p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-200'>
                Zona Horaria
              </label>
              <p className='text-sm mt-1 text-white'>
                {laboratory.config?.timezone}
              </p>
            </div>
            {laboratory.config?.webhooks && (
              <div>
                <label className='text-sm font-medium text-gray-200'>
                  Webhooks
                </label>
                <div className='mt-1 space-y-1 text-xs font-mono bg-black/20 backdrop-blur-sm p-2 rounded border border-white/10'>
                  {Object.entries(laboratory.config.webhooks).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className='text-white'>{key}:</span>{' '}
                        <span className='text-[#4c87ff]'>{value as string}</span>
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
          <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-white/10'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              ⚠️ Confirmar Eliminación
            </h3>
            <p className='text-gray-200 mb-4'>
              ¿Estás seguro de eliminar el cliente{' '}
              <strong className='text-white'>{laboratory.name}</strong>?
            </p>
            <p className='text-sm text-red-400 mb-6'>
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
                className='flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 bg-black/20 backdrop-blur-sm'
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
