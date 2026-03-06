'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type {
  Laboratory,
  ModuleCatalog,
  ModuleConfig,
} from '@/lib/types/database';
import {
  ClipboardList,
  Save,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Code,
  Eye,
  DollarSign,
} from 'lucide-react';
import type { PaymentFrequency, PaymentStatus } from '@/lib/types/database';
import {
  generateCodePreview,
  validateCodeTemplate,
  getTemplateExamples,
} from '@/lib/utils/code-preview';

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
    next_payment_date: '' as string,
    payment_frequency: 'monthly' as PaymentFrequency,
    billing_amount: '' as number | '',
    payment_status: 'current' as PaymentStatus,
    renewal_day_of_month: '' as number | '', // Opción B: obligatorio 1-31
    branding: {
      logo: '' as string | null,
      icon: '',
      favicon: '' as string | null,
      primaryColor: '#0066cc',
      secondaryColor: '#00cc66',
    },
    config: {
      examTypes: ['Biopsia', 'Citología', 'Inmunohistoquímica'],
      branches: ['Principal'],
      paymentMethods: ['Efectivo', 'Zelle'],
      defaultExchangeRate: 36.5,
      timezone: 'America/Caracas',
      phoneNumber: '',
      webhooks: {
        generateDoc: '',
        generatePdf: '',
        sendEmail: '',
      },
      modules: {} as Record<string, ModuleConfig>,
      codeTemplate: '',
      codeMappings: {} as Record<string, string>,
    },
  });

  useEffect(() => {
    loadLaboratory();
    loadModules();
  }, [params.id]);

  const loadModules = async () => {
    try {
      const res = await fetch('/api/modules');
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data ?? [];
      setModules(data.filter((m: ModuleCatalog) => m.is_active !== false));
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadLaboratory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laboratories/${params.id}`);
      if (!res.ok) {
        alert('❌ Error al cargar cliente');
        router.push('/laboratories');
        setLoading(false);
        return;
      }
      const json = await res.json();
      const data = json.data;
      if (!data) {
        alert('❌ Error al cargar cliente');
        router.push('/laboratories');
        setLoading(false);
        return;
      }
      setLaboratory(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        status: data.status,
        next_payment_date: data.next_payment_date ? String(data.next_payment_date).slice(0, 10) : '',
        payment_frequency: data.payment_frequency || 'monthly',
        billing_amount: data.billing_amount != null ? data.billing_amount : '',
        payment_status: data.payment_status || 'current',
        renewal_day_of_month: data.renewal_day_of_month != null ? data.renewal_day_of_month : '',
        branding: {
          logo: data.branding?.logo || null,
          icon: data.branding?.icon || 'solhub',
          favicon: data.branding?.favicon || null,
          primaryColor: data.branding?.primaryColor || '#0066cc',
          secondaryColor: data.branding?.secondaryColor || '#00cc66',
        },
        config: {
          examTypes: data.config?.examTypes || [
            'Biopsia',
            'Citología',
            'Inmunohistoquímica',
          ],
          branches: data.config?.branches || ['Principal'],
          paymentMethods: data.config?.paymentMethods || ['Efectivo', 'Zelle'],
          defaultExchangeRate: data.config?.defaultExchangeRate || 36.5,
          timezone: data.config?.timezone || 'America/Caracas',
          phoneNumber: data.config?.phoneNumber || '',
          webhooks: data.config?.webhooks || {
            generateDoc: '',
            generatePdf: '',
            sendEmail: '',
          },
          modules: data.config?.modules || {},
          codeTemplate: data.config?.codeTemplate || '',
          codeMappings: data.config?.codeMappings || {},
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validar antes de guardar
      const errors: string[] = [];

      if (formData.config.examTypes.length === 0) {
        errors.push('Debe haber al menos 1 tipo de examen');
      }
      if (formData.config.branches.length === 0) {
        errors.push('Debe haber al menos 1 sede');
      }
      if (formData.config.paymentMethods.length === 0) {
        errors.push('Debe haber al menos 1 método de pago');
      }
      // Opción B: día de renovación obligatorio (1-31)
      const renewalDay = formData.renewal_day_of_month;
      if (renewalDay === '' || renewalDay == null) {
        errors.push('El día de renovación (1-31) es obligatorio');
      } else if (Number(renewalDay) < 1 || Number(renewalDay) > 31) {
        errors.push('El día de renovación debe estar entre 1 y 31');
      }

      // Validar duplicados
      if (
        new Set(formData.config.examTypes).size !==
        formData.config.examTypes.length
      ) {
        errors.push('Hay tipos de examen duplicados');
      }
      if (
        new Set(formData.config.branches).size !==
        formData.config.branches.length
      ) {
        errors.push('Hay sedes duplicadas');
      }
      if (
        new Set(formData.config.paymentMethods).size !==
        formData.config.paymentMethods.length
      ) {
        errors.push('Hay métodos de pago duplicados');
      }

      if (errors.length > 0) {
        alert('❌ Errores de validación:\n' + errors.join('\n'));
        setSaving(false);
        return;
      }

      // Construir objeto de actualización
      const updateData: any = {
        name: formData.name,
        status: formData.status,
        next_payment_date: formData.next_payment_date || null,
        payment_frequency: formData.payment_frequency,
        billing_amount: formData.billing_amount === '' ? null : Number(formData.billing_amount),
        payment_status: formData.payment_status,
        renewal_day_of_month: formData.renewal_day_of_month === '' ? null : Number(formData.renewal_day_of_month),
        branding: {
          logo: formData.branding.logo || null,
          icon: formData.branding.icon,
          favicon: formData.branding.favicon || null,
          primaryColor: formData.branding.primaryColor,
          secondaryColor: formData.branding.secondaryColor,
        },
        config: {
          examTypes: formData.config.examTypes.filter((e) => e.trim() !== ''),
          branches: formData.config.branches.filter((b) => b.trim() !== ''),
          paymentMethods: formData.config.paymentMethods.filter(
            (p) => p.trim() !== '',
          ),
          defaultExchangeRate: formData.config.defaultExchangeRate,
          timezone: formData.config.timezone,
          phoneNumber: formData.config.phoneNumber?.replace(/[^\d+]/g, '') || '',
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

      // CRÍTICO: Incluir modules en config para no perder la configuración de módulos
      if (
        formData.config.modules &&
        Object.keys(formData.config.modules).length > 0
      ) {
        updateData.config.modules = formData.config.modules;
      }

      // Incluir configuración de códigos si existe
      if (formData.config.codeTemplate) {
        updateData.config.codeTemplate = formData.config.codeTemplate;
      }
      if (
        formData.config.codeMappings &&
        Object.keys(formData.config.codeMappings).length > 0
      ) {
        updateData.config.codeMappings = formData.config.codeMappings;
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
    field: 'examTypes' | 'branches' | 'paymentMethods',
    value: string,
  ) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const currentArray = formData.config[field];

    // Validar duplicados
    if (currentArray.includes(trimmedValue)) {
      alert(`❌ "${trimmedValue}" ya existe en la lista`);
      return;
    }

    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [field]: [...currentArray, trimmedValue],
      },
    });
  };

  // Helper para eliminar item de array
  const removeArrayItem = (
    field: 'examTypes' | 'branches' | 'paymentMethods',
    index: number,
  ) => {
    const currentArray = formData.config[field];

    // Validar mínimo 1 item
    if (currentArray.length <= 1) {
      alert(
        `❌ Debe haber al menos 1 ${
          field === 'examTypes'
            ? 'tipo de examen'
            : field === 'branches'
            ? 'sede'
            : 'método de pago'
        }`,
      );
      return;
    }

    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [field]: currentArray.filter((_, i) => i !== index),
      },
    });
  };

  // Helper para reordenar (mover arriba)
  const moveItemUp = (
    field: 'examTypes' | 'branches' | 'paymentMethods',
    index: number,
  ) => {
    if (index === 0) return;

    const newArray = [...formData.config[field]];
    [newArray[index - 1], newArray[index]] = [
      newArray[index],
      newArray[index - 1],
    ];

    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [field]: newArray,
      },
    });
  };

  // Helper para reordenar (mover abajo)
  const moveItemDown = (
    field: 'examTypes' | 'branches' | 'paymentMethods',
    index: number,
  ) => {
    const currentArray = formData.config[field];
    if (index === currentArray.length - 1) return;

    const newArray = [...currentArray];
    [newArray[index], newArray[index + 1]] = [
      newArray[index + 1],
      newArray[index],
    ];

    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [field]: newArray,
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
          <Link href='/laboratories' className='hover:text-[#4c87ff]'>
            Clientes
          </Link>
          <span>/</span>
          <Link
            href={`/laboratories/${params.id}`}
            className='hover:text-[#4c87ff]'
          >
            {laboratory.name}
          </Link>
          <span>/</span>
          <span className='text-white'>Editar</span>
        </div>
        <h1 className='text-3xl font-bold text-white drop-shadow-lg'>
          Editar Cliente
        </h1>
        <p className='text-gray-200 mt-1 drop-shadow-md'>
          Actualiza la información del cliente {laboratory.name}
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Información Básica */}
        <div className='bg-black/30 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            <ClipboardList className='w-5 h-5' />
            Información Básica
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Nombre <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Slug <span className='text-gray-400'>(No editable)</span>
              </label>
              <input
                type='text'
                value={formData.slug}
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm text-white opacity-60 cursor-not-allowed'
                disabled
              />
              <p className='text-xs text-gray-400 mt-1'>
                El slug no se puede modificar después de crear el cliente
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Estado <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                style={{
                  colorScheme: 'dark',
                }}
                disabled={saving}
              >
                <option value='active' className='bg-black text-white'>
                  Activo
                </option>
                <option value='inactive' className='bg-black text-white'>
                  Inactivo
                </option>
                <option value='trial' className='bg-black text-white'>
                  Prueba
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Pagos / Facturación (Opción B: día de renovación obligatorio) */}
        <div className='bg-black/30 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            <DollarSign className='w-5 h-5' />
            Pagos / Facturación
          </h2>
          <p className='text-sm text-gray-400 mb-4'>
            Día de renovación obligatorio (1-31). Si el día es mayor al último del mes, se usará el último día de ese mes al calcular la próxima fecha.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Próxima fecha de pago <span className='text-gray-400'>(opcional)</span>
              </label>
              <input
                type='date'
                value={formData.next_payment_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_payment_date: e.target.value })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Monto (USD) <span className='text-gray-400'>(opcional)</span>
              </label>
              <input
                type='number'
                step='0.01'
                min='0'
                value={formData.billing_amount === '' ? '' : formData.billing_amount}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    billing_amount: v === '' ? '' : parseFloat(v) || 0,
                  });
                }}
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                placeholder='0.00'
                disabled={saving}
              />
              {laboratory?.config?.defaultExchangeRate != null && formData.billing_amount !== '' && Number(formData.billing_amount) > 0 && (
                <p className='text-xs text-gray-400 mt-1'>
                  ≈ {(Number(formData.billing_amount) * (laboratory.config.defaultExchangeRate || 1)).toFixed(2)} Bs
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Día de renovación <span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                min={1}
                max={31}
                value={formData.renewal_day_of_month === '' ? '' : formData.renewal_day_of_month}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    renewal_day_of_month: v === '' ? '' : Math.min(31, Math.max(1, parseInt(v, 10) || 1)),
                  });
                }}
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                placeholder='Ej: 10'
                disabled={saving}
                required
              />
              <p className='text-xs text-gray-400 mt-1'>
                Día del mes (1-31). Usado al marcar como pagado.
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Frecuencia de pago
              </label>
              <select
                value={formData.payment_frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_frequency: e.target.value as PaymentFrequency,
                  })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white'
                style={{ colorScheme: 'dark' }}
                disabled={saving}
              >
                <option value='monthly' className='bg-black text-white'>Mensual</option>
                <option value='weekly' className='bg-black text-white'>Semanal</option>
                <option value='yearly' className='bg-black text-white'>Anual</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Estado de pago
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_status: e.target.value as PaymentStatus,
                  })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white'
                style={{ colorScheme: 'dark' }}
                disabled={saving}
              >
                <option value='current' className='bg-black text-white'>Al día</option>
                <option value='overdue' className='bg-black text-white'>Vencido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className='bg-black/30 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4'>
            🎨 Branding
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
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
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                placeholder='/logos/labname.png'
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
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
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                placeholder='solhub'
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
                Favicon URL
              </label>
              <input
                type='text'
                value={formData.branding.favicon || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: {
                      ...formData.branding,
                      favicon: e.target.value || null,
                    },
                  })
                }
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                placeholder='/favicon.ico'
                disabled={saving}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
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
                  className='w-16 h-10 border border-white/20 rounded-lg'
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
                  className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 font-mono text-white placeholder-gray-400'
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
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
                  className='w-16 h-10 border border-white/20 rounded-lg'
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
                  className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 font-mono text-white placeholder-gray-400'
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configuración */}
        <div className='bg-black/30 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            <Settings className='w-5 h-5' />
            ⚙️ Configuración
          </h2>
          <p className='text-sm text-gray-400 mb-6'>
            Estas opciones aparecerán en los dropdowns del formulario de
            registro del cliente.
          </p>
          <div className='space-y-8'>
            {/* Tipos de Examen */}
            <div>
              <label className='block text-sm font-medium text-white mb-3'>
                Tipos de Examen{' '}
                <span className='text-gray-400 text-xs'>
                  (Configurados por Admin)
                </span>
              </label>
              <p className='text-xs text-gray-400 mb-3'>
                Estas opciones aparecerán en el dropdown "Tipo de Examen" del
                formulario de registro del cliente.
              </p>
              <div className='space-y-2 mb-3'>
                {formData.config.examTypes.map((examType, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10'
                  >
                    <span className='text-sm text-gray-300 mr-2 min-w-[24px]'>
                      {index + 1}.
                    </span>
                    <input
                      type='text'
                      value={examType}
                      onChange={(e) => {
                        const newTypes = [...formData.config.examTypes];
                        newTypes[index] = e.target.value;
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            examTypes: newTypes,
                          },
                        });
                      }}
                      className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                      disabled={saving}
                    />
                    <div className='flex items-center gap-1'>
                      <button
                        type='button'
                        onClick={() => moveItemUp('examTypes', index)}
                        disabled={index === 0 || saving}
                        className='p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Mover arriba'
                      >
                        <ChevronUp className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => moveItemDown('examTypes', index)}
                        disabled={
                          index === formData.config.examTypes.length - 1 ||
                          saving
                        }
                        className='p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Mover abajo'
                      >
                        <ChevronDown className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => removeArrayItem('examTypes', index)}
                        disabled={
                          formData.config.examTypes.length <= 1 || saving
                        }
                        className='p-2 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Eliminar'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='newExamType'
                  placeholder='Nuevo tipo de examen'
                  className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addArrayItem('examTypes', input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type='button'
                  onClick={() => {
                    const input = document.getElementById(
                      'newExamType',
                    ) as HTMLInputElement;
                    addArrayItem('examTypes', input.value);
                    input.value = '';
                  }}
                  className='px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] shadow-lg shadow-[#4c87ff]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  disabled={saving}
                >
                  <Plus className='w-4 h-4' />
                  Agregar
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                ℹ️ Mínimo 1 tipo requerido
              </p>
            </div>

            {/* Sucursales */}
            <div>
              <label className='block text-sm font-medium text-white mb-3'>
                Sedes{' '}
                <span className='text-gray-400 text-xs'>
                  (Configuradas por Admin)
                </span>
              </label>
              <p className='text-xs text-gray-400 mb-3'>
                Estas opciones aparecerán en el dropdown "Sede" del formulario
                de registro del cliente.
              </p>
              <div className='space-y-2 mb-3'>
                {formData.config.branches.map((branch, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10'
                  >
                    <span className='text-sm text-gray-300 mr-2 min-w-[24px]'>
                      {index + 1}.
                    </span>
                    <input
                      type='text'
                      value={branch}
                      onChange={(e) => {
                        const newBranches = [...formData.config.branches];
                        newBranches[index] = e.target.value;
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            branches: newBranches,
                          },
                        });
                      }}
                      className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                      disabled={saving}
                    />
                    <div className='flex items-center gap-1'>
                      <button
                        type='button'
                        onClick={() => moveItemUp('branches', index)}
                        disabled={index === 0 || saving}
                        className='p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Mover arriba'
                      >
                        <ChevronUp className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => moveItemDown('branches', index)}
                        disabled={
                          index === formData.config.branches.length - 1 ||
                          saving
                        }
                        className='p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Mover abajo'
                      >
                        <ChevronDown className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => removeArrayItem('branches', index)}
                        disabled={
                          formData.config.branches.length <= 1 || saving
                        }
                        className='p-2 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Eliminar'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='newBranch'
                  placeholder='Nueva sede'
                  className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
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
                  className='px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] shadow-lg shadow-[#4c87ff]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  disabled={saving}
                >
                  <Plus className='w-4 h-4' />
                  Agregar
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                ℹ️ Mínimo 1 sede requerida
              </p>
            </div>

            {/* Métodos de Pago */}
            <div>
              <label className='block text-sm font-medium text-white mb-3'>
                Métodos de Pago{' '}
                <span className='text-gray-400 text-xs'>
                  (Configurados por Admin)
                </span>
              </label>
              <p className='text-xs text-gray-400 mb-3'>
                Estas opciones aparecerán en el dropdown "Método de Pago" del
                formulario de registro del cliente.
              </p>
              <div className='space-y-2 mb-3'>
                {formData.config.paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10'
                  >
                    <span className='text-sm text-gray-300 mr-2 min-w-[24px]'>
                      {index + 1}.
                    </span>
                    <input
                      type='text'
                      value={method}
                      onChange={(e) => {
                        const newMethods = [...formData.config.paymentMethods];
                        newMethods[index] = e.target.value;
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            paymentMethods: newMethods,
                          },
                        });
                      }}
                      className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                      disabled={saving}
                    />
                    <div className='flex items-center gap-1'>
                      <button
                        type='button'
                        onClick={() => moveItemUp('paymentMethods', index)}
                        disabled={index === 0 || saving}
                        className='p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Mover arriba'
                      >
                        <ChevronUp className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => moveItemDown('paymentMethods', index)}
                        disabled={
                          index === formData.config.paymentMethods.length - 1 ||
                          saving
                        }
                        className='p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Mover abajo'
                      >
                        <ChevronDown className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => removeArrayItem('paymentMethods', index)}
                        disabled={
                          formData.config.paymentMethods.length <= 1 || saving
                        }
                        className='p-2 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Eliminar'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='newPayment'
                  placeholder='Nuevo método de pago'
                  className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
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
                  className='px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] shadow-lg shadow-[#4c87ff]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  disabled={saving}
                >
                  <Plus className='w-4 h-4' />
                  Agregar
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                ℹ️ Mínimo 1 método requerido
              </p>
            </div>

            {/* Tasa de Cambio, Zona Horaria y Teléfono */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-200 mb-2'>
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
                  className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                  disabled={saving}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-200 mb-2'>
                  Zona Horaria
                </label>
                <select
                  className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                  style={{
                    colorScheme: 'dark',
                  }}
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
                    <option
                      key={timezone}
                      value={timezone}
                      className='bg-black text-white'
                    >
                      {timezone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-200 mb-2'>
                  Teléfono
                </label>
                <div className='flex items-center'>
                  <span className='px-3 py-2 bg-black/30 border border-white/20 rounded-l-lg text-white select-none'>+</span>
                  <input
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    value={(formData.config.phoneNumber || '').replace(/^\+/, '')}
                    onChange={(e) => {
                      // Solo permitir números
                      const onlyNums = e.target.value.replace(/\D/g, '');
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          phoneNumber: '+' + onlyNums,
                        },
                      });
                    }}
                    className='w-full px-3 py-2 border-t border-b border-r border-white/20 rounded-r-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                    placeholder='584121234567'
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Webhooks */}
            <div>
              <label className='block text-sm font-medium text-gray-200 mb-2'>
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
                  className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
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
                  className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
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
                  className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Códigos */}
        <div className='bg-black/30 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/10'>
          <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
            <Code className='w-5 h-5' />
            🔢 Configuración de Códigos
          </h2>
          <p className='text-sm text-gray-400 mb-6'>
            Configura el formato de códigos personalizado para este laboratorio.
            Si no se configura, se usará el formato por defecto de Conspat.
          </p>

          <div className='space-y-6'>
            {/* Plantilla de Código */}
            <div>
              <label className='block text-sm font-medium text-white mb-2'>
                Plantilla de Código{' '}
                <span className='text-gray-400 text-xs'>(Opcional)</span>
              </label>
              <input
                type='text'
                value={formData.config.codeTemplate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...formData.config,
                      codeTemplate: e.target.value,
                    },
                  })
                }
                placeholder='{examCode}{counter:4}{month}{year:2}'
                className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400 font-mono'
                disabled={saving}
              />
              <p className='text-xs text-gray-400 mt-2'>
                Placeholders disponibles:{' '}
                <code className='text-[#4c87ff]'>{'{examCode}'}</code>,{' '}
                <code className='text-[#4c87ff]'>{'{type}'}</code>,{' '}
                <code className='text-[#4c87ff]'>{'{counter:N}'}</code>,{' '}
                <code className='text-[#4c87ff]'>{'{month}'}</code>,{' '}
                <code className='text-[#4c87ff]'>{'{year:2}'}</code>,{' '}
                <code className='text-[#4c87ff]'>{'{year:4}'}</code>,{' '}
                <code className='text-[#4c87ff]'>{'{day:2}'}</code>
              </p>

              {/* Ejemplos de plantillas */}
              <div className='mt-4'>
                <p className='text-xs text-gray-400 mb-2'>Ejemplos:</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {getTemplateExamples().map((example) => (
                    <button
                      key={example.name}
                      type='button'
                      onClick={() =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            codeTemplate: example.template,
                          },
                        })
                      }
                      className='text-left p-2 bg-black/40 rounded border border-white/10 hover:border-[#4c87ff]/50 transition-colors'
                      disabled={saving}
                    >
                      <div className='text-xs font-semibold text-white'>
                        {example.name}
                      </div>
                      <div className='text-xs text-gray-300 font-mono'>
                        {example.template}
                      </div>
                      <div className='text-xs text-gray-400'>
                        {example.example}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón para formato Conspat */}
              <div className='mt-3'>
                <button
                  type='button'
                  onClick={() =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        codeTemplate: '{type}{year:2}{counter:3}{month}',
                      },
                    })
                  }
                  className='px-4 py-2 bg-[#4c87ff]/20 text-[#4c87ff] rounded-lg hover:bg-[#4c87ff]/30 border border-[#4c87ff]/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={saving}
                >
                  Usar formato Conspat (default)
                </button>
              </div>

              {/* Validación y Preview */}
              {formData.config.codeTemplate && (
                <div className='mt-4 p-3 bg-black/40 rounded border border-white/10'>
                  {(() => {
                    const validation = validateCodeTemplate(
                      formData.config.codeTemplate,
                    );
                    if (!validation.isValid) {
                      return (
                        <div className='text-red-400 text-sm'>
                          ⚠️ {validation.errorMessage}
                        </div>
                      );
                    }

                    // Generar múltiples previews con diferentes valores
                    const previews: Array<{
                      label: string;
                      code: string | null;
                    }> = [];

                    // Preview 1: Primer tipo de examen, contador 1
                    const firstExamType =
                      formData.config.examTypes[0] || 'Citología';
                    previews.push({
                      label: `${firstExamType} (contador 1)`,
                      code: generateCodePreview({
                        template: formData.config.codeTemplate,
                        codeMappings: formData.config.codeMappings || {},
                        examType: firstExamType,
                        type: 1,
                        counter: 1,
                      }),
                    });

                    // Preview 2: Mismo tipo, contador 10
                    previews.push({
                      label: `${firstExamType} (contador 10)`,
                      code: generateCodePreview({
                        template: formData.config.codeTemplate,
                        codeMappings: formData.config.codeMappings || {},
                        examType: firstExamType,
                        type: 1,
                        counter: 10,
                      }),
                    });

                    // Preview 3: Segundo tipo de examen si existe
                    if (formData.config.examTypes.length > 1) {
                      const secondExamType = formData.config.examTypes[1];
                      previews.push({
                        label: `${secondExamType} (contador 1)`,
                        code: generateCodePreview({
                          template: formData.config.codeTemplate,
                          codeMappings: formData.config.codeMappings || {},
                          examType: secondExamType,
                          type: 2,
                          counter: 1,
                        }),
                      });
                    }

                    return (
                      <div>
                        <div className='flex items-center gap-2 mb-3'>
                          <Eye className='w-4 h-4 text-gray-400' />
                          <span className='text-sm font-medium text-white'>
                            Preview:
                          </span>
                        </div>
                        <div className='space-y-2'>
                          {previews.map((preview, idx) => (
                            <div key={idx}>
                              {preview.code ? (
                                <div className='flex items-center gap-3'>
                                  <span className='text-xs text-gray-400 min-w-[140px]'>
                                    {preview.label}:
                                  </span>
                                  <div className='text-sm font-mono text-[#4c87ff] bg-black/60 px-3 py-1 rounded'>
                                    {preview.code}
                                  </div>
                                </div>
                              ) : (
                                <div className='text-xs text-gray-400'>
                                  {preview.label}: No se puede generar (verifica
                                  mapeos)
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {previews.every((p) => !p.code) && (
                          <div className='text-xs text-gray-400 mt-2'>
                            ⚠️ No se puede generar preview. Verifica que todos
                            los placeholders estén configurados correctamente.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Mapeos de Exámenes */}
            <div>
              <label className='block text-sm font-medium text-white mb-3'>
                Mapeos de Exámenes{' '}
                <span className='text-gray-400 text-xs'>(Opcional)</span>
              </label>
              <p className='text-xs text-gray-400 mb-3'>
                Define los códigos que se usarán para cada tipo de examen en la
                plantilla. Solo necesario si usas{' '}
                <code className='text-[#4c87ff]'>{'{examCode}'}</code> en la
                plantilla.
              </p>

              <div className='space-y-2 mb-3'>
                {Object.entries(formData.config.codeMappings || {}).map(
                  ([examType, code], index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10'
                    >
                      <input
                        type='text'
                        value={examType}
                        onChange={(e) => {
                          const newMappings = {
                            ...formData.config.codeMappings,
                          };
                          delete newMappings[examType];
                          newMappings[e.target.value] = code;
                          setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              codeMappings: newMappings,
                            },
                          });
                        }}
                        placeholder='Tipo de examen'
                        className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                        disabled={saving}
                      />
                      <span className='text-gray-400'>→</span>
                      <input
                        type='text'
                        value={code}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              codeMappings: {
                                ...formData.config.codeMappings,
                                [examType]: e.target.value.toUpperCase(),
                              },
                            },
                          });
                        }}
                        placeholder='Código'
                        maxLength={10}
                        className='w-24 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400 font-mono uppercase'
                        disabled={saving}
                      />
                      <button
                        type='button'
                        onClick={() => {
                          const newMappings = {
                            ...formData.config.codeMappings,
                          };
                          delete newMappings[examType];
                          setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              codeMappings: newMappings,
                            },
                          });
                        }}
                        className='p-2 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed'
                        title='Eliminar'
                        disabled={saving}
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ),
                )}
              </div>

              {/* Agregar nuevo mapeo */}
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='newExamMappingType'
                  placeholder='Tipo de examen'
                  className='flex-1 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const typeInput = e.currentTarget;
                      const codeInput = document.getElementById(
                        'newExamMappingCode',
                      ) as HTMLInputElement;
                      if (typeInput.value.trim() && codeInput.value.trim()) {
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            codeMappings: {
                              ...formData.config.codeMappings,
                              [typeInput.value.trim()]: codeInput.value
                                .trim()
                                .toUpperCase(),
                            },
                          },
                        });
                        typeInput.value = '';
                        codeInput.value = '';
                      }
                    }
                  }}
                />
                <input
                  type='text'
                  id='newExamMappingCode'
                  placeholder='Código'
                  maxLength={10}
                  className='w-32 px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400 font-mono uppercase'
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const codeInput = e.currentTarget;
                      const typeInput = document.getElementById(
                        'newExamMappingType',
                      ) as HTMLInputElement;
                      if (typeInput.value.trim() && codeInput.value.trim()) {
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            codeMappings: {
                              ...formData.config.codeMappings,
                              [typeInput.value.trim()]: codeInput.value
                                .trim()
                                .toUpperCase(),
                            },
                          },
                        });
                        typeInput.value = '';
                        codeInput.value = '';
                      }
                    }
                  }}
                />
                <button
                  type='button'
                  onClick={() => {
                    const typeInput = document.getElementById(
                      'newExamMappingType',
                    ) as HTMLInputElement;
                    const codeInput = document.getElementById(
                      'newExamMappingCode',
                    ) as HTMLInputElement;
                    if (typeInput.value.trim() && codeInput.value.trim()) {
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          codeMappings: {
                            ...formData.config.codeMappings,
                            [typeInput.value.trim()]: codeInput.value
                              .trim()
                              .toUpperCase(),
                          },
                        },
                      });
                      typeInput.value = '';
                      codeInput.value = '';
                    }
                  }}
                  className='px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] shadow-lg shadow-[#4c87ff]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  disabled={saving}
                >
                  <Plus className='w-4 h-4' />
                  Agregar
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                ℹ️ Ejemplo: "Citología" → "CI", "Mamografía" → "MA"
              </p>
            </div>
          </div>
        </div>

        {/* Configuración de Módulos */}
        {laboratory && (
          <div className='bg-black/30 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/10'>
            <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
              <Settings className='w-5 h-5' />
              ⚙️ Configuración de Módulos
            </h2>
            <p className='text-sm text-gray-300 mb-4'>
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
                  <div key={module.id} className='mb-6 border border-white/10 rounded-lg p-4 bg-black/20'>
                    <h3 className='font-semibold text-white mb-3'>
                      📦 {module.module_name} ({module.feature_key})
                    </h3>

                    {/* Campos */}
                    {module.structure.fields &&
                      Object.keys(module.structure.fields).length > 0 && (
                        <div className='mb-4'>
                          <h4 className='text-sm font-medium text-gray-300 mb-2'>
                            Campos:
                          </h4>
                          <div className='space-y-2'>
                            {Object.entries(module.structure.fields).map(
                              ([fieldName, fieldDef]) => {
                                // Estructura con enabled y required
                                const fieldConfig =
                                  typeof moduleConfig.fields?.[fieldName] ===
                                    'object' &&
                                  moduleConfig.fields?.[fieldName] !== null
                                    ? moduleConfig.fields[fieldName]
                                    : {
                                        enabled:
                                          typeof moduleConfig.fields?.[
                                            fieldName
                                          ] === 'boolean'
                                            ? moduleConfig.fields[fieldName] // Compatibilidad con estructura antigua (solo boolean)
                                            : fieldDef.defaultEnabled,
                                        required: fieldDef.defaultRequired,
                                      };

                                return (
                                  <div
                                    key={fieldName}
                                    className='flex items-center gap-4 p-2 bg-black/40 backdrop-blur-sm rounded border border-white/10'
                                  >
                                    <span className='flex-1 font-medium text-white'>
                                      {fieldDef.label}
                                    </span>
                                    <label className='flex items-center gap-2 text-gray-300'>
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
                                    <label className='flex items-center gap-2 text-gray-300'>
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
                          <h4 className='text-sm font-medium text-gray-300 mb-2'>
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
                                    className='flex items-center gap-4 p-2 bg-black/40 backdrop-blur-sm rounded border border-white/10'
                                  >
                                    <span className='flex-1 font-medium text-white'>
                                      {actionDef.label}
                                    </span>
                                    <label className='flex items-center gap-2 text-gray-300'>
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
                          <h4 className='text-sm font-medium mb-2 text-gray-300'>
                            Settings:
                          </h4>
                          <div className='text-sm text-gray-300 bg-black/40 backdrop-blur-sm p-3 rounded border border-white/10'>
                            <pre className='whitespace-pre-wrap text-gray-200'>
                              {JSON.stringify(
                                module.structure.settings,
                                null,
                                2,
                              )}
                            </pre>
                            <p className='text-xs text-gray-400 mt-2'>
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
              <p className='text-gray-400 text-sm'>
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
            className='px-6 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 shadow-lg shadow-[#4c87ff]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
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
