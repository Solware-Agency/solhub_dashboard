'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type {
  Laboratory,
  ModuleCatalog,
  ModuleConfig,
} from '@/lib/types/database';
import { ClipboardList, Save, Settings } from 'lucide-react';

export default function EditLaboratoryPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [modules, setModules] = useState<ModuleCatalog[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'active' as 'active' | 'inactive' | 'trial',
    branding: {
      logo: '' as string | null,
      icon: '',
      primaryColor: '#0066cc',
      secondaryColor: '#00cc66',
    },
    config: {
      branches: ['Principal'],
      paymentMethods: ['Efectivo', 'Zelle'],
      defaultExchangeRate: 36.5,
      timezone: 'America/Caracas',
      webhooks: {
        generateDoc: '',
        generatePdf: '',
        sendEmail: '',
      },
      modules: {} as Record<string, ModuleConfig>,
    },
  });

  useEffect(() => {
    loadLaboratory();
    loadModules();
  }, [params.id]);

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('module_catalog')
        .select('*')
        .eq('is_active', true);

      if (!error && data) {
        setModules(data);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadLaboratory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('laboratories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!error && data) {
      setLaboratory(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        status: data.status,
        branding: {
          logo: data.branding?.logo || null,
          icon: data.branding?.icon || 'solhub',
          primaryColor: data.branding?.primaryColor || '#0066cc',
          secondaryColor: data.branding?.secondaryColor || '#00cc66',
        },
        config: {
          branches: data.config?.branches || ['Principal'],
          paymentMethods: data.config?.paymentMethods || ['Efectivo', 'Zelle'],
          defaultExchangeRate: data.config?.defaultExchangeRate || 36.5,
          timezone: data.config?.timezone || 'America/Caracas',
          webhooks: data.config?.webhooks || {
            generateDoc: '',
            generatePdf: '',
            sendEmail: '',
          },
          modules: data.config?.modules || {},
        },
      });
    } else {
      alert('❌ Error al cargar cliente');
      router.push('/laboratories');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Construir objeto de actualización
      const updateData: any = {
        name: formData.name,
        status: formData.status,
        branding: {
          logo: formData.branding.logo || null,
          icon: formData.branding.icon,
          primaryColor: formData.branding.primaryColor,
          secondaryColor: formData.branding.secondaryColor,
        },
        config: {
          branches: formData.config.branches.filter((b) => b.trim() !== ''),
          paymentMethods: formData.config.paymentMethods.filter(
            (p) => p.trim() !== '',
          ),
          defaultExchangeRate: formData.config.defaultExchangeRate,
          timezone: formData.config.timezone,
        },
      };

      // Solo agregar webhooks si tienen valores
      const webhooks = formData.config.webhooks;
      if (webhooks.generateDoc || webhooks.generatePdf || webhooks.sendEmail) {
        updateData.config.webhooks = {};
        if (webhooks.generateDoc)
          updateData.config.webhooks.generateDoc = webhooks.generateDoc;
        if (webhooks.generatePdf)
          updateData.config.webhooks.generatePdf = webhooks.generatePdf;
        if (webhooks.sendEmail)
          updateData.config.webhooks.sendEmail = webhooks.sendEmail;
      }

      const response = await fetch(`/api/laboratories/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar laboratorio');
      }

      alert('✅ Cliente actualizado exitosamente');
      router.push(`/laboratories/${params.id}`);
      router.refresh();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper para agregar item a array
  const addArrayItem = (
    field: 'branches' | 'paymentMethods',
    value: string,
  ) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        config: {
          ...formData.config,
          [field]: [...formData.config[field], value],
        },
      });
    }
  };

  // Helper para eliminar item de array
  const removeArrayItem = (
    field: 'branches' | 'paymentMethods',
    index: number,
  ) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [field]: formData.config[field].filter((_, i) => i !== index),
      },
    });
  };

  if (loading) {
    return <div className='text-gray-600'>Cargando...</div>;
  }

  if (!laboratory) {
    return <div className='text-red-600'>Cliente no encontrado</div>;
  }

  const timeZones = Intl.supportedValuesOf('timeZone');

  return (
    <div>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
          <Link href='/laboratories' className='hover:text-blue-600'>
            Clientes
          </Link>
          <span>/</span>
          <Link
            href={`/laboratories/${params.id}`}
            className='hover:text-blue-600'
          >
            {laboratory.name}
          </Link>
          <span>/</span>
          <span className='text-gray-900'>Editar</span>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>Editar Cliente</h1>
        <p className='text-gray-600 mt-1'>
          Actualiza la información del cliente {laboratory.name}
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Información Básica */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <ClipboardList className='w-5 h-5' />
            Información Básica
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nombre <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Slug <span className='text-gray-400'>(No editable)</span>
              </label>
              <input
                type='text'
                value={formData.slug}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500'
                disabled
              />
              <p className='text-xs text-gray-500 mt-1'>
                El slug no se puede modificar después de crear el cliente
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Estado <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                disabled={saving}
              >
                <option value='active'>Activo</option>
                <option value='inactive'>Inactivo</option>
                <option value='trial'>Prueba</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            🎨 Branding
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Logo URL
              </label>
              <input
                type='text'
                value={formData.branding.logo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: {
                      ...formData.branding,
                      logo: e.target.value || null,
                    },
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                placeholder='/logos/labname.png'
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Ícono
              </label>
              <input
                type='text'
                value={formData.branding.icon}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, icon: e.target.value },
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                placeholder='solhub'
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Color Primario
              </label>
              <div className='flex gap-2'>
                <input
                  type='color'
                  value={formData.branding.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: {
                        ...formData.branding,
                        primaryColor: e.target.value,
                      },
                    })
                  }
                  className='w-16 h-10 border border-gray-300 rounded-lg'
                  disabled={saving}
                />
                <input
                  type='text'
                  value={formData.branding.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: {
                        ...formData.branding,
                        primaryColor: e.target.value,
                      },
                    })
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-600'
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Color Secundario
              </label>
              <div className='flex gap-2'>
                <input
                  type='color'
                  value={formData.branding.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: {
                        ...formData.branding,
                        secondaryColor: e.target.value,
                      },
                    })
                  }
                  className='w-16 h-10 border border-gray-300 rounded-lg'
                  disabled={saving}
                />
                <input
                  type='text'
                  value={formData.branding.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: {
                        ...formData.branding,
                        secondaryColor: e.target.value,
                      },
                    })
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-600'
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configuración */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            ⚙️ Configuración
          </h2>
          <div className='space-y-6'>
            {/* Sucursales */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Sucursales
              </label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {formData.config.branches.map((branch, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded'
                  >
                    <span className='text-sm'>{branch}</span>
                    <button
                      type='button'
                      onClick={() => removeArrayItem('branches', index)}
                      className='text-blue-900 hover:text-blue-950'
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='newBranch'
                  placeholder='Nueva sucursal'
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addArrayItem('branches', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type='button'
                  onClick={() => {
                    const input = document.getElementById(
                      'newBranch',
                    ) as HTMLInputElement;
                    addArrayItem('branches', input.value);
                    input.value = '';
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  disabled={saving}
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Métodos de Pago
              </label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {formData.config.paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded'
                  >
                    <span className='text-sm'>{method}</span>
                    <button
                      type='button'
                      onClick={() => removeArrayItem('paymentMethods', index)}
                      className='text-green-900 hover:text-green-950'
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='newPayment'
                  placeholder='Nuevo método de pago'
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addArrayItem('paymentMethods', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type='button'
                  onClick={() => {
                    const input = document.getElementById(
                      'newPayment',
                    ) as HTMLInputElement;
                    addArrayItem('paymentMethods', input.value);
                    input.value = '';
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  disabled={saving}
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Tasa de Cambio y Zona Horaria */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tasa de Cambio (USD/VES)
                </label>
                <input
                  type='number'
                  step='0.01'
                  value={formData.config.defaultExchangeRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        defaultExchangeRate: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  disabled={saving}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Zona Horaria
                </label>
                <select
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  name='timezone'
                  id='timezone'
                  value={formData.config.timezone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, timezone: e.target.value },
                    })
                  }
                  disabled={saving}
                >
                  {timeZones.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Webhooks */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Webhooks (Opcional)
              </label>
              <div className='space-y-3'>
                <input
                  type='url'
                  value={formData.config.webhooks.generateDoc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        webhooks: {
                          ...formData.config.webhooks,
                          generateDoc: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder='Generate Doc Webhook'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  disabled={saving}
                />
                <input
                  type='url'
                  value={formData.config.webhooks.generatePdf}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        webhooks: {
                          ...formData.config.webhooks,
                          generatePdf: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder='Generate PDF Webhook'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  disabled={saving}
                />
                <input
                  type='url'
                  value={formData.config.webhooks.sendEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        webhooks: {
                          ...formData.config.webhooks,
                          sendEmail: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder='Send Email Webhook'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Módulos */}
        {laboratory && (
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <Settings className='w-5 h-5' />
              ⚙️ Configuración de Módulos
            </h2>
            <p className='text-sm text-gray-600 mb-4'>
              Configura campos, acciones y settings de cada módulo. Solo
              aparecen módulos de features habilitadas.
            </p>

            {modules
              .filter(
                (module) =>
                  laboratory.features?.[
                    module.feature_key as keyof typeof laboratory.features
                  ],
              )
              .map((module) => {
                const moduleConfig = formData.config.modules?.[
                  module.module_name
                ] || {
                  fields: {},
                  actions: {},
                  settings: {},
                };

                return (
                  <div key={module.id} className='mb-6 border rounded-lg p-4'>
                    <h3 className='font-semibold text-gray-800 mb-3'>
                      📦 {module.module_name} ({module.feature_key})
                    </h3>

                    {/* Campos */}
                    {module.structure.fields &&
                      Object.keys(module.structure.fields).length > 0 && (
                        <div className='mb-4'>
                          <h4 className='text-sm font-medium text-gray-700 mb-2'>
                            Campos:
                          </h4>
                          <div className='space-y-2'>
                            {Object.entries(module.structure.fields).map(
                              ([fieldName, fieldDef]) => {
                                // Estructura con enabled y required
                                const fieldConfig = typeof moduleConfig.fields?.[fieldName] === 'object' && moduleConfig.fields?.[fieldName] !== null
                                  ? moduleConfig.fields[fieldName]
                                  : {
                                      enabled: typeof moduleConfig.fields?.[fieldName] === 'boolean'
                                        ? moduleConfig.fields[fieldName] // Compatibilidad con estructura antigua (solo boolean)
                                        : fieldDef.defaultEnabled,
                                      required: fieldDef.defaultRequired,
                                    };

                                return (
                                  <div
                                    key={fieldName}
                                    className='flex items-center gap-4 p-2 bg-gray-50 rounded'
                                  >
                                    <span className='flex-1 font-medium text-gray-700'>
                                      {fieldDef.label}
                                    </span>
                                    <label className='flex items-center gap-2 text-gray-700'>
                                      <input
                                        type='checkbox'
                                        checked={fieldConfig.enabled}
                                        onChange={(e) => {
                                          const newModules = {
                                            ...formData.config.modules,
                                          };
                                          if (!newModules[module.module_name]) {
                                            newModules[module.module_name] = {
                                              fields: {},
                                              actions: {},
                                              settings: {},
                                            };
                                          }
                                          if (
                                            !newModules[module.module_name]
                                              .fields
                                          ) {
                                            newModules[
                                              module.module_name
                                            ].fields = {};
                                          }
                                          newModules[
                                            module.module_name
                                          ].fields![fieldName] = {
                                            enabled: e.target.checked,
                                            required: fieldConfig.required,
                                          };
                                          setFormData({
                                            ...formData,
                                            config: {
                                              ...formData.config,
                                              modules: newModules,
                                            },
                                          });
                                        }}
                                        className='rounded'
                                      />
                                      <span className='text-sm'>
                                        Habilitado
                                      </span>
                                    </label>
                                    <label className='flex items-center gap-2 text-gray-700'>
                                      <input
                                        type='checkbox'
                                        checked={fieldConfig.required}
                                        onChange={(e) => {
                                          const newModules = {
                                            ...formData.config.modules,
                                          };
                                          if (!newModules[module.module_name]) {
                                            newModules[module.module_name] = {
                                              fields: {},
                                              actions: {},
                                              settings: {},
                                            };
                                          }
                                          if (
                                            !newModules[module.module_name]
                                              .fields
                                          ) {
                                            newModules[
                                              module.module_name
                                            ].fields = {};
                                          }
                                          newModules[
                                            module.module_name
                                          ].fields![fieldName] = {
                                            enabled: fieldConfig.enabled,
                                            required: e.target.checked,
                                          };
                                          setFormData({
                                            ...formData,
                                            config: {
                                              ...formData.config,
                                              modules: newModules,
                                            },
                                          });
                                        }}
                                        disabled={!fieldConfig.enabled}
                                        className='rounded'
                                      />
                                      <span className='text-sm'>Requerido</span>
                                    </label>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* Acciones */}
                    {module.structure.actions &&
                      Object.keys(module.structure.actions).length > 0 && (
                        <div className='mb-4'>
                          <h4 className='text-sm font-medium text-gray-700 mb-2'>
                            Acciones:
                          </h4>
                          <div className='space-y-2'>
                            {Object.entries(module.structure.actions).map(
                              ([actionName, actionDef]) => {
                                const actionEnabled =
                                  moduleConfig.actions?.[actionName] ??
                                  actionDef.defaultEnabled;

                                return (
                                  <div
                                    key={actionName}
                                    className='flex items-center gap-4 p-2 bg-gray-50 rounded'
                                  >
                                    <span className='flex-1 font-medium text-gray-700'>
                                      {actionDef.label}
                                    </span>
                                    <label className='flex items-center gap-2 text-gray-700'>
                                      <input
                                        type='checkbox'
                                        checked={actionEnabled}
                                        onChange={(e) => {
                                          const newModules = {
                                            ...formData.config.modules,
                                          };
                                          if (!newModules[module.module_name]) {
                                            newModules[module.module_name] = {
                                              fields: {},
                                              actions: {},
                                              settings: {},
                                            };
                                          }
                                          if (
                                            !newModules[module.module_name]
                                              .actions
                                          ) {
                                            newModules[
                                              module.module_name
                                            ].actions = {};
                                          }
                                          newModules[
                                            module.module_name
                                          ].actions![actionName] =
                                            e.target.checked;
                                          setFormData({
                                            ...formData,
                                            config: {
                                              ...formData.config,
                                              modules: newModules,
                                            },
                                          });
                                        }}
                                        className='rounded'
                                      />
                                      <span className='text-sm'>
                                        Habilitado
                                      </span>
                                    </label>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* Settings (solo lectura por ahora) */}
                    {module.structure.settings &&
                      Object.keys(module.structure.settings).length > 0 && (
                        <div>
                          <h4 className='text-sm font-medium mb-2 text-gray-700'>
                            Settings:
                          </h4>
                          <div className='text-sm text-gray-600 bg-gray-50 p-3 rounded'>
                            <pre className='whitespace-pre-wrap'>
                              {JSON.stringify(
                                module.structure.settings,
                                null,
                                2,
                              )}
                            </pre>
                            <p className='text-xs text-gray-500 mt-2'>
                              ⚠️ Los settings se configuran desde el catálogo de
                              módulos
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}

            {modules.filter(
              (module) =>
                laboratory.features?.[
                  module.feature_key as keyof typeof laboratory.features
                ],
            ).length === 0 && (
              <p className='text-gray-500 text-sm'>
                No hay módulos configurados para las features habilitadas de
                este laboratorio. Crea módulos en &quot;Módulos&quot; para las
                features que este laboratorio tiene habilitadas.
              </p>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className='flex gap-4'>
          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
          >
            {saving ? (
              'Guardando...'
            ) : (
              <>
                <Save className='w-4 h-4 mr-2 inline-block' />
                Guardar Cambios
              </>
            )}
          </button>
          <Link
            href={`/laboratories/${params.id}`}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-block'
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
