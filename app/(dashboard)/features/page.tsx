'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Laboratory, FeatureCatalog } from '@/lib/types/database';
import { BookOpen, Building2, Flag, Plus, Edit, Trash2, Save, X, CheckCircle2, AlertTriangle } from 'lucide-react';

type Tab = 'catalog' | 'assign';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [features, setFeatures] = useState<FeatureCatalog[]>([]);
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para el CRUD de features
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureCatalog | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFeature, setDeletingFeature] = useState<FeatureCatalog | null>(
    null,
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [labsRes, featuresRes] = await Promise.all([
        supabase.from('laboratories').select('*').order('name'),
        supabase
          .from('feature_catalog')
          .select('*')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (labsRes.data) {
        setLaboratories(labsRes.data);
        if (labsRes.data.length > 0) {
          setSelectedLab(labsRes.data[0]);
        }
      }

      if (featuresRes.data) {
        setFeatures(featuresRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, currentValue: boolean) => {
    if (!selectedLab) return;

    setSaving(true);
    try {
      const updatedFeatures = {
        ...selectedLab.features,
        [featureKey]: !currentValue,
      };

      console.log('🔄 Actualizando feature:', {
        labId: selectedLab.id,
        labName: selectedLab.name,
        featureKey,
        oldValue: currentValue,
        newValue: !currentValue,
        updatedFeatures,
      });

      // Llamar a API Route en lugar de Supabase directo
      const response = await fetch(`/api/laboratories/${selectedLab.id}/features`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features: updatedFeatures }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error al actualizar:', errorData);
        throw new Error(errorData.error || 'Error al actualizar features');
      }

      const { data } = await response.json();

      console.log('✅ Feature actualizada correctamente:', data);
      console.log('✅ Valor de hasCaseGenerator después del UPDATE:', data.features?.hasCaseGenerator);
      
      // Verificar que el valor realmente cambió
      if (data.features?.[featureKey as keyof typeof data.features] !== !currentValue) {
        console.warn('⚠️ ADVERTENCIA: El valor no cambió después del UPDATE. Puede ser un problema de sincronización.');
      }

      // Recargar datos para asegurar sincronización
      await loadData();

      // Actualizar estado local con los datos frescos
      const freshLab = data;
      setSelectedLab(freshLab);
      setLaboratories((labs) =>
        labs.map((lab) => (lab.id === freshLab.id ? freshLab : lab)),
      );

      // Mostrar notificación breve
      const notification = document.createElement('div');
      notification.className =
        'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `✓ Feature "${featureKey}" ${
        !currentValue ? 'habilitada' : 'deshabilitada'
      }`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error: unknown) {
      console.error('❌ Error completo:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert(
        `❌ Error al actualizar feature: ${errorMessage}\n\nPor favor, revisa la consola para más detalles.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      core: 'bg-[#4c87ff]/20 text-[#4c87ff] border border-[#4c87ff]/30',
      premium: 'bg-purple-100 text-purple-800',
      addon: 'bg-orange-100 text-orange-800',
    };
    return styles[category as keyof typeof styles] || styles.core;
  };

  const getPlanBadge = (plan: string) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-green-100 text-green-800',
      pro: 'bg-[#41e2b8]/20 text-[#41e2b8] border border-[#41e2b8]/30',
      enterprise: 'bg-purple-100 text-purple-800',
    };
    return styles[plan as keyof typeof styles] || styles.free;
  };

  // Handlers para CRUD
  const handleCreateFeature = async (formData: Partial<FeatureCatalog>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: formData.key!,
          name: formData.name!,
          description: formData.description || null,
          category: formData.category || 'core',
          required_plan: formData.required_plan || 'free',
          icon: formData.icon || null,
          component_path: formData.component_path || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear feature');
      }

      alert(
        '✅ Feature creada exitosamente. Trigger sincronizará con todos los clientes.',
      );
      setShowCreateModal(false);
      loadData(); // Recargar datos
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert('❌ Error: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditFeature = async (formData: Partial<FeatureCatalog>) => {
    if (!editingFeature) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/features/${editingFeature.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          required_plan: formData.required_plan,
          icon: formData.icon,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar feature');
      }

      alert('✅ Feature actualizada');
      setShowEditModal(false);
      setEditingFeature(null);
      loadData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert('❌ Error: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async () => {
    if (!deletingFeature) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/features/${deletingFeature.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar feature');
      }

      alert('✅ Feature eliminada de todos los clientes');
      setShowDeleteModal(false);
      setDeletingFeature(null);
      loadData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert('❌ Error: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className='text-gray-200'>Cargando...</div>;
  }

  return (
    <div>
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <Flag className='w-8 h-8 text-white' />
          <h1 className='text-3xl font-bold text-white drop-shadow-lg'>
            Gestión de Features
          </h1>
        </div>
        <p className='text-gray-200 mt-1 drop-shadow-md'>
          Administra el catálogo de features y asígnalas a clientes
        </p>
      </div>

      {/* Tabs */}
      <div className='mb-6 border-b border-white/10'>
        <div className='flex gap-8'>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-4 px-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-b-2 border-[#4c87ff] text-[#4c87ff]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <BookOpen className='w-4 h-4' />
            Catálogo de Features
          </button>
          <button
            onClick={() => setActiveTab('assign')}
            className={`pb-4 px-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'assign'
                ? 'border-b-2 border-[#4c87ff] text-[#4c87ff]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Building2 className='w-4 h-4' />
            Asignar a Cliente
          </button>
        </div>
      </div>

      {/* Tab: Catálogo de Features */}
      {activeTab === 'catalog' && (
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg border border-white/10'>
          <div className='px-6 py-4 border-b border-white/10 flex justify-between items-center'>
            <div>
              <h2 className='text-xl font-semibold text-white'>
                Catálogo de Features
              </h2>
              <p className='text-sm text-gray-300 mt-1'>
                {features.length} features en el sistema
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className='px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] transition-colors font-medium flex items-center gap-2 shadow-lg shadow-[#4c87ff]/30'
            >
              <Plus className='w-4 h-4' />
              Nueva Feature
            </button>
          </div>

          <div className='p-6'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-white/10'>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                    Feature
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                    Key
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                    Categoría
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                    Plan
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase'>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr
                    key={feature.id}
                    className='border-b border-white/10 hover:bg-black/40 transition-colors'
                  >
                    <td className='px-4 py-4'>
                      <div>
                        <p className='font-medium text-white'>
                          {feature.name}
                        </p>
                        {feature.description && (
                          <p className='text-sm text-gray-300 mt-1'>
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <code className='text-xs bg-black/40 px-2 py-1 rounded text-gray-300 border border-white/10'>
                        {feature.key}
                      </code>
                    </td>
                    <td className='px-4 py-4'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadge(
                          feature.category,
                        )}`}
                      >
                        {feature.category}
                      </span>
                    </td>
                    <td className='px-4 py-4'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getPlanBadge(
                          feature.required_plan,
                        )}`}
                      >
                        {feature.required_plan}
                      </span>
                    </td>
                    <td className='px-4 py-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => {
                            setEditingFeature(feature);
                            setShowEditModal(true);
                          }}
                          className='bg-[#4c87ff] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#3d6fe6] transition-colors flex items-center gap-1 shadow-md shadow-[#4c87ff]/30'
                        >
                          <Edit className='w-3 h-3' />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setDeletingFeature(feature);
                            setShowDeleteModal(true);
                          }}
                          className='bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1'
                        >
                          <Trash2 className='w-3 h-3' />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Asignar a Cliente */}
      {activeTab === 'assign' && (
        <>
          {laboratories.length === 0 ? (
            <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-12 text-center border border-white/10'>
              <Building2 className='w-16 h-16 mx-auto mb-4 text-gray-400' />
              <p className='text-gray-300'>No hay clientes en el sistema</p>
            </div>
          ) : (
            <div className='grid grid-cols-12 gap-6'>
              {/* Selector de Cliente */}
              <div className='col-span-3 bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-4 border border-white/10'>
                <h2 className='font-semibold text-white mb-4'>Clientes</h2>
                <div className='space-y-2'>
                  {laboratories.map((lab) => (
                    <button
                      key={lab.id}
                      onClick={() => setSelectedLab(lab)}
                      className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedLab?.id === lab.id
                          ? 'bg-[#4c87ff]/20 text-[#4c87ff] border-2 border-[#4c87ff] font-medium'
                          : 'hover:bg-black/40 border-2 border-transparent'
                      }`}
                    >
                      <div className='font-medium text-white'>
                        {lab.name}
                      </div>
                      <div className='text-xs text-gray-300 mt-1'>
                        {lab.slug}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features del Lab Seleccionado */}
              <div className='col-span-9'>
                {selectedLab ? (
                  <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg border border-white/10'>
                    <div className='px-6 py-4 border-b border-white/10'>
                      <h2 className='text-xl font-semibold text-white'>
                        Features de:{' '}
                        <span className='text-[#4c87ff]'>
                          {selectedLab.name}
                        </span>
                      </h2>
                      <p className='text-sm text-gray-300 mt-1'>
                        {
                          features.filter(
                            (f) =>
                              selectedLab.features[
                                f.key as keyof typeof selectedLab.features
                              ],
                          ).length
                        }{' '}
                        de {features.length} features habilitadas
                      </p>
                    </div>

                    <div className='p-6'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b border-gray-200'>
                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                              Feature
                            </th>
                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                              Categoría
                            </th>
                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                              Plan
                            </th>
                            <th className='px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase'>
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {features.map((feature) => {
                            const isEnabled =
                              selectedLab.features[
                                feature.key as keyof typeof selectedLab.features
                              ];
                            return (
                              <tr
                                key={feature.id}
                                className='border-b border-white/10 hover:bg-black/40 transition-colors'
                              >
                                <td className='px-4 py-4'>
                                  <div>
                                    <p className='font-medium text-white'>
                                      {feature.name}
                                    </p>
                                    <p className='text-sm text-gray-300 mt-1'>
                                      {feature.description}
                                    </p>
                                    <p className='text-xs text-gray-300 mt-1 font-mono'>
                                      {feature.key}
                                    </p>
                                  </div>
                                </td>
                                <td className='px-4 py-4'>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadge(
                                      feature.category,
                                    )}`}
                                  >
                                    {feature.category}
                                  </span>
                                </td>
                                <td className='px-4 py-4'>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${getPlanBadge(
                                      feature.required_plan,
                                    )}`}
                                  >
                                    {feature.required_plan}
                                  </span>
                                </td>
                                <td className='px-4 py-4 text-center'>
                                  <button
                                    onClick={() =>
                                      toggleFeature(feature.key, isEnabled ?? false)
                                    }
                                    disabled={saving}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center ${
                                      isEnabled
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isEnabled ? (
                                      <>
                                        <CheckCircle2 className='w-4 h-4' />
                                        Habilitado
                                      </>
                                    ) : (
                                      <>
                                        <X className='w-4 h-4' />
                                        Deshabilitado
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-12 text-center border border-white/10'>
                    <Flag className='w-16 h-16 mx-auto mb-4 text-gray-400' />
                    <p className='text-gray-300'>
                      Selecciona un cliente para gestionar sus features
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Crear Feature */}
      {showCreateModal && (
        <FeatureFormModal
          mode='create'
          onSubmit={handleCreateFeature}
          onClose={() => setShowCreateModal(false)}
          saving={saving}
        />
      )}

      {/* Modal: Editar Feature */}
      {showEditModal && editingFeature && (
        <FeatureFormModal
          mode='edit'
          feature={editingFeature}
          onSubmit={handleEditFeature}
          onClose={() => {
            setShowEditModal(false);
            setEditingFeature(null);
          }}
          saving={saving}
        />
      )}

      {/* Modal: Confirmar Eliminación */}
      {showDeleteModal && deletingFeature && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-white/10'>
            <div className='flex items-center gap-2 mb-4'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
              <h3 className='text-lg font-semibold text-white'>
                Confirmar Eliminación
              </h3>
            </div>
            <p className='text-gray-300 mb-4'>
              ¿Estás seguro de eliminar la feature{' '}
              <strong>{deletingFeature.name}</strong>?
            </p>
            <p className='text-sm text-red-600 mb-6'>
              Esta acción eliminará la feature de TODOS los clientes y no se
              puede deshacer.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={handleDeleteFeature}
                disabled={saving}
                className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {saving ? (
                  'Eliminando...'
                ) : (
                  <>
                    <Trash2 className='w-4 h-4' />
                    Sí, Eliminar
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingFeature(null);
                }}
                disabled={saving}
                className='flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-black/20 backdrop-blur-sm'
              >
                <X className='w-4 h-4' />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente: Modal de Formulario para Crear/Editar Feature
function FeatureFormModal({
  mode,
  feature,
  onSubmit,
  onClose,
  saving,
}: {
  mode: 'create' | 'edit';
  feature?: FeatureCatalog;
  onSubmit: (data: Partial<FeatureCatalog>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<FeatureCatalog>>({
    key: feature?.key || '',
    name: feature?.name || '',
    description: feature?.description || '',
    category: feature?.category || 'core',
    required_plan: feature?.required_plan || 'free',
    icon: feature?.icon || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
          {mode === 'create' ? (
            <>
              <Plus className='w-5 h-5' />
              Crear Nueva Feature
            </>
          ) : (
            <>
              <Edit className='w-5 h-5' />
              Editar Feature
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Key (solo en create) */}
          {mode === 'create' && (
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-1'>
                Key (camelCase) <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                placeholder='Ej: hasBillingModule'
                pattern='[a-z][a-zA-Z0-9]*'
                required
                disabled={saving}
              />
              <p className='text-xs text-gray-300 mt-1'>
                Debe empezar con minúscula y usar camelCase
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className='block text-sm font-medium text-gray-200 mb-1'>
              Nombre <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              placeholder='Ej: Módulo de Facturación'
              required
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-200 mb-1'>
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              placeholder='Descripción detallada de la feature'
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-medium text-gray-200 mb-1'>
              Categoría <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as 'core' | 'premium' | 'addon',
                })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              disabled={saving}
            >
              <option value='core'>Core</option>
              <option value='premium'>Premium</option>
              <option value='addon'>Addon</option>
            </select>
          </div>

          {/* Required Plan */}
          <div>
            <label className='block text-sm font-medium text-gray-200 mb-1'>
              Plan Requerido <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.required_plan}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  required_plan: e.target.value as
                    | 'free'
                    | 'basic'
                    | 'pro'
                    | 'enterprise',
                })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              disabled={saving}
            >
              <option value='free'>Free</option>
              <option value='basic'>Basic</option>
              <option value='pro'>Pro</option>
              <option value='enterprise'>Enterprise</option>
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className='block text-sm font-medium text-gray-200 mb-1'>
              Ícono (opcional)
            </label>
            <input
              type='text'
              value={formData.icon || ''}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              placeholder='Ej: 💰'
              disabled={saving}
            />
          </div>

          {mode === 'create' && (
            <div className='bg-[#4c87ff]/10 border border-[#4c87ff]/30 rounded-lg p-3'>
              <p className='text-sm text-[#29536b]'>
                <strong>ℹ️ Nota:</strong> Al crear la feature, se sincronizará
                automáticamente con TODOS los clientes (con valor FALSE por
                defecto).
              </p>
            </div>
          )}

          {/* Botones */}
          <div className='flex gap-3 pt-4'>
            <button
              type='submit'
              disabled={saving}
              className='flex-1 px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#4c87ff]/30'
            >
              {saving ? (
                'Guardando...'
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  {mode === 'create' ? 'Crear Feature' : 'Guardar Cambios'}
                </>
              )}
            </button>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-black/20 backdrop-blur-sm'
            >
              <X className='w-4 h-4' />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
