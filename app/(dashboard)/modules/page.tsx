'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ModuleCatalog, FeatureCatalog } from '@/lib/types/database';
import { Package, Plus, Edit, Trash2, Save, X, CheckCircle2 } from 'lucide-react';

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleCatalog[]>([]);
  const [features, setFeatures] = useState<FeatureCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleCatalog | null>(null);
  const [formData, setFormData] = useState({
    feature_key: '',
    module_name: '',
    structure: {
      fields: {} as Record<string, { label: string; defaultEnabled: boolean; defaultRequired: boolean }>,
      actions: {} as Record<string, { label: string; defaultEnabled: boolean }>,
      settings: {} as Record<string, any>,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modulesRes, featuresRes] = await Promise.all([
        supabase.from('module_catalog').select('*').order('created_at', { ascending: false }),
        supabase.from('feature_catalog').select('*').eq('is_active', true).order('name'),
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (featuresRes.error) throw featuresRes.error;

      setModules(modulesRes.data || []);
      setFeatures(featuresRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      alert('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const structure = {
        fields: formData.structure.fields,
        actions: formData.structure.actions,
        settings: formData.structure.settings,
      };

      if (editingModule) {
        // Actualizar módulo existente usando API Route
        const response = await fetch(`/api/modules/${editingModule.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: formData.feature_key,
            module_name: formData.module_name,
            structure,
            updated_at: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al actualizar módulo');
        }

        alert('✅ Módulo actualizado exitosamente');
      } else {
        // Crear nuevo módulo usando API Route
        const response = await fetch('/api/modules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: formData.feature_key,
            module_name: formData.module_name,
            structure,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear módulo');
        }

        alert('✅ Módulo creado exitosamente');
      }

      setShowForm(false);
      setEditingModule(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving module:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleEdit = (module: ModuleCatalog) => {
    setEditingModule(module);
    setFormData({
      feature_key: module.feature_key,
      module_name: module.module_name,
        structure: {
          fields: (module.structure.fields || {}) as Record<string, { label: string; defaultEnabled: boolean; defaultRequired: boolean }>,
          actions: (module.structure.actions || {}) as Record<string, { label: string; defaultEnabled: boolean }>,
          settings: module.structure.settings || {},
        },
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este módulo? Esto también eliminará la configuración del módulo en todos los laboratorios.')) return;

    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar módulo');
      }

      alert('✅ Módulo eliminado exitosamente');
      loadData();
    } catch (error: any) {
      console.error('Error deleting module:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      feature_key: '',
      module_name: '',
      structure: {
        fields: {} as Record<string, { label: string; defaultEnabled: boolean; defaultRequired: boolean }>,
        actions: {} as Record<string, { label: string; defaultEnabled: boolean }>,
        settings: {} as Record<string, any>,
      },
    });
  };

  const addField = () => {
    const fieldName = prompt('Nombre del campo (ej: cedula, email):');
    if (!fieldName) return;

    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        fields: {
          ...formData.structure.fields,
          [fieldName]: {
            label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
            defaultEnabled: true,
            defaultRequired: false,
          },
        },
      },
    });
  };

  const removeField = (fieldName: string) => {
    const newFields = { ...formData.structure.fields };
    delete newFields[fieldName];
    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        fields: newFields,
      },
    });
  };

  const addAction = () => {
    const actionName = prompt('Nombre de la acción (ej: generatePdf):');
    if (!actionName) return;

    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        actions: {
          ...formData.structure.actions,
          [actionName]: {
            label: actionName,
            defaultEnabled: true,
          },
        },
      },
    });
  };

  const removeAction = (actionName: string) => {
    const newActions = { ...formData.structure.actions };
    delete newActions[actionName];
    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        actions: newActions,
      },
    });
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Package className="w-7 h-7 sm:w-8 sm:h-8 text-white shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">Catálogo de Módulos</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingModule(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-[#4c87ff] text-white px-4 py-2 rounded-lg hover:bg-[#3d6fe6] shadow-lg shadow-[#4c87ff]/30 transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Crear Nuevo Módulo
        </button>
      </div>

      {showForm && (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            {editingModule ? (
              <>
                <Edit className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">Editar Módulo</h2>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">Crear Nuevo Módulo</h2>
              </>
            )}
          </div>

          <div className="bg-[#4c87ff]/10 border border-[#4c87ff]/30 p-4 rounded mb-4">
            <p className="text-sm text-gray-200 flex items-start gap-2">
              <span className="text-yellow-600 font-bold">⚠️</span>
              <span><strong>Importante:</strong> Primero debes crear la feature en "Features" antes de crear el módulo.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-200">Feature Key:</label>
              <select
                value={formData.feature_key}
                onChange={(e) => setFormData({ ...formData, feature_key: e.target.value })}
                className="w-full border border-white/20 rounded px-3 py-2 bg-black/20 backdrop-blur-sm text-white"
                required
              >
                <option value="">Seleccionar feature...</option>
                {features.map((f) => (
                  <option key={f.id} value={f.key}>
                    {f.name} ({f.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-200">Nombre del Módulo:</label>
              <input
                type="text"
                value={formData.module_name}
                onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
                className="w-full border border-white/20 rounded px-3 py-2 bg-black/20 backdrop-blur-sm text-white placeholder-gray-400"
                placeholder="ej: registrationForm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-white">Campos del Formulario:</label>
                <button
                  type="button"
                  onClick={addField}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar Campo
                </button>
              </div>
              {Object.entries(formData.structure.fields).map(([fieldName, fieldConfig]) => (
                <div key={fieldName} className="border border-white/20 rounded p-3 mb-2 bg-black/20 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-2 text-white">
                    <strong>Campo: {fieldName}</strong>
                    <button
                      type="button"
                      onClick={() => removeField(fieldName)}
                      className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-sm text-gray-200">Label:</label>
                      <input
                        type="text"
                        value={fieldConfig.label}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            structure: {
                              ...formData.structure,
                              fields: {
                                ...formData.structure.fields,
                                [fieldName]: { ...fieldConfig, label: e.target.value },
                              },
                            },
                          })
                        }
                        className="w-full border border-white/20 rounded px-2 py-1 text-sm bg-black/20 backdrop-blur-sm text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={fieldConfig.defaultEnabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              structure: {
                                ...formData.structure,
                                fields: {
                                  ...formData.structure.fields,
                                  [fieldName]: { ...fieldConfig, defaultEnabled: e.target.checked },
                                },
                              },
                            })
                          }
                          className="mr-1"
                        />
                        Habilitado por defecto
                      </label>
                    </div>
                    <div>
                      <label className="text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={fieldConfig.defaultRequired}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              structure: {
                                ...formData.structure,
                                fields: {
                                  ...formData.structure.fields,
                                  [fieldName]: { ...fieldConfig, defaultRequired: e.target.checked },
                                },
                              },
                            })
                          }
                          className="mr-1"
                        />
                        Requerido por defecto
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-white">Acciones:</label>
                <button
                  type="button"
                  onClick={addAction}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar Acción
                </button>
              </div>
              {Object.entries(formData.structure.actions).map(([actionName, actionConfig]) => (
                <div key={actionName} className="border border-white/20 rounded p-3 mb-2 bg-black/20 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-2 text-white">
                    <strong>Acción: {actionName}</strong>
                    <button
                      type="button"
                      onClick={() => removeAction(actionName)}
                      className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-gray-200">Label:</label>
                      <input
                        type="text"
                        value={actionConfig.label}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            structure: {
                              ...formData.structure,
                              actions: {
                                ...formData.structure.actions,
                                [actionName]: { ...actionConfig, label: e.target.value },
                              },
                            },
                          })
                        }
                        className="w-full border border-white/20 rounded px-2 py-1 text-sm bg-black/20 backdrop-blur-sm text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={actionConfig.defaultEnabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              structure: {
                                ...formData.structure,
                                actions: {
                                  ...formData.structure.actions,
                                  [actionName]: { ...actionConfig, defaultEnabled: e.target.checked },
                                },
                              },
                            })
                          }
                          className="mr-1"
                        />
                        Habilitado por defecto
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-[#4c87ff] text-white px-4 py-2 rounded-lg hover:bg-[#3d6fe6] shadow-lg shadow-[#4c87ff]/30 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Módulo
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingModule(null);
                  resetForm();
                }}
                className="bg-[#4c87ff] text-white px-4 py-2 rounded-lg hover:bg-[#3d6fe6] transition-colors flex items-center gap-2 shadow-lg shadow-[#4c87ff]/30"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-lg overflow-hidden max-w-full">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[400px]">
          <thead className="bg-black/40 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">Módulo</th>
              <th className="px-4 py-3 text-left text-gray-300">Feature Key</th>
              <th className="px-4 py-3 text-left text-gray-300">Estado</th>
              <th className="px-4 py-3 text-left text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {modules.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-300">
                  No hay módulos creados aún
                </td>
              </tr>
            ) : (
              modules.map((module) => (
                <tr key={module.id} className="border-t border-white/10 hover:bg-black/40">
                  <td className="px-4 py-3 font-semibold text-white">{module.module_name}</td>
                  <td className="px-4 py-3 text-gray-300">{module.feature_key}</td>
                  <td className="px-4 py-3">
                    {module.is_active ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Activo
                      </span>
                    ) : (
                      <span className="text-gray-400">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(module)}
                        className="bg-[#4c87ff] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#3d6fe6] shadow-md shadow-[#4c87ff]/30 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(module.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

