'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { LaboratoryCode, Laboratory } from '@/lib/types/database'
import { Key, Plus, X, Save, RefreshCw, CheckCircle2, XCircle, AlertCircle, Copy } from 'lucide-react'
 
type CodeWithLab = LaboratoryCode & { laboratory: Laboratory }

export default function CodesPage() {
  const [codes, setCodes] = useState<CodeWithLab[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    laboratory_id: '',
    code: '',
    max_uses: '',
    expires_at: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [codesRes, labsRes] = await Promise.all([
        supabase.from('laboratory_codes').select('*, laboratory:laboratories(*)').order('created_at', { ascending: false }),
        supabase.from('laboratories').select('*').eq('status', 'active').order('name'),
      ])

      if (codesRes.data) setCodes(codesRes.data as CodeWithLab[])
      if (labsRes.data) setLaboratories(labsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.laboratory_id || !formData.code) {
      alert('Por favor completa los campos requeridos')
      return
    }

    try {
      const insertData: any = {
        laboratory_id: formData.laboratory_id,
        code: formData.code.toUpperCase().trim(),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      }

      const response = await fetch('/api/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(insertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear código');
      }

      alert('✅ Código creado exitosamente')
      setShowForm(false)
      setFormData({ laboratory_id: '', code: '', max_uses: '', expires_at: '' })
      loadData()
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    }
  }

  const handleCopyToClipboard = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value)
			alert('📋 Copiado')
		} catch {
			alert('❌ No se pudo copiar')
		}
	}

  const generateRandomCode = () => {
    const lab = laboratories.find(l => l.id === formData.laboratory_id)
    if (!lab) return

    const prefix = lab.slug.toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData({ ...formData, code: `${prefix}-${random}` })
  }

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/codes/${codeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar código');
      }

      loadData()
    } catch (error: any) {
      alert('❌ Error: ' + error.message)
    }
  }

  if (loading) {
    return <div className="text-gray-600">Cargando códigos...</div>
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <div className='flex items-center gap-3 mb-2'>
            <Key className='w-8 h-8 text-gray-700' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Códigos de Acceso
            </h1>
          </div>
          <p className='text-gray-600 mt-1'>
            Gestiona códigos para que usuarios se registren en clientes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
        >
          {showForm ? (
            <>
              <X className='w-4 h-4' />
              Cancelar
            </>
          ) : (
            <>
              <Plus className='w-4 h-4' />
              Crear Código
            </>
          )}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className='bg-white p-6 rounded-lg shadow mb-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Plus className='w-5 h-5 text-gray-700' />
            <h2 className='text-lg font-semibold text-gray-900'>
              Crear Nuevo Código
            </h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Cliente <span className='text-red-500'>*</span>
                </label>
                <select
                  value={formData.laboratory_id}
                  onChange={(e) =>
                    setFormData({ ...formData, laboratory_id: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  required
                >
                  <option value=''>Seleccionar cliente...</option>
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Código <span className='text-red-500'>*</span>
                </label>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                    placeholder='CONSPAT-ABC123'
                    required
                  />
                  <button
                    type='button'
                    onClick={generateRandomCode}
                    disabled={!formData.laboratory_id}
                    className='px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    title='Generar código aleatorio'
                  >
                    <RefreshCw className='w-4 h-4' />
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Usos Máximos (opcional)
                </label>
                <input
                  type='number'
                  value={formData.max_uses}
                  onChange={(e) =>
                    setFormData({ ...formData, max_uses: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  placeholder='Dejar vacío = ilimitado'
                  min='1'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Fecha de Expiración (opcional)
                </label>
                <input
                  type='date'
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600'
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <button
              type='submit'
              className='px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2'
            >
              <Save className='w-4 h-4' />
              Crear Código
            </button>
          </form>
        </div>
      )}

      {/* Tabla de Códigos */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Código
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Cliente
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Usos
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Expira
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                Estado
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-6 py-8 text-center text-gray-500'>
                  No hay códigos creados
                </td>
              </tr>
            ) : (
              codes.map((code) => {
                const isExpired =
                  code.expires_at && new Date(code.expires_at) < new Date();
                const isMaxed =
                  code.max_uses !== null && code.current_uses >= code.max_uses;
                return (
                  <tr key={code.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4'>
                      <span className='flex items-center gap-2 font-mono text-sm font-semibold text-gray-900'>
                        {code.code}
                        <button
                          onClick={() => handleCopyToClipboard(code.code, 'Código')}
                          className='ml-2 text-gray-500 hover:text-gray-700'
                        >
                          <Copy className='w-4 h-4 cursor-pointer hover:text-gray-700' />
                        </button>
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {code.laboratory.name}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {code.current_uses} / {code.max_uses || '∞'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {code.expires_at
                        ? new Date(code.expires_at).toLocaleDateString('es-ES')
                        : 'Nunca'}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit ${
                          !code.is_active
                            ? 'bg-gray-100 text-gray-800'
                            : isExpired || isMaxed
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {!code.is_active ? (
                          <>
                            <XCircle className='w-3 h-3' />
                            Inactivo
                          </>
                        ) : isExpired ? (
                          <>
                            <AlertCircle className='w-3 h-3' />
                            Expirado
                          </>
                        ) : isMaxed ? (
                          <>
                            <AlertCircle className='w-3 h-3' />
                            Agotado
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className='w-3 h-3' />
                            Activo
                          </>
                        )}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <button
                        onClick={() =>
                          toggleCodeStatus(code.id, code.is_active)
                        }
                        className='bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1'
                      >
                        {code.is_active ? (
                          <>
                            <XCircle className='w-3 h-3' />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className='w-3 h-3' />
                            Activar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className='mt-4 text-sm text-gray-600'>
        Total: <span className='font-semibold'>{codes.length}</span> código
        {codes.length !== 1 && 's'}
      </p>
    </div>
  );
}

