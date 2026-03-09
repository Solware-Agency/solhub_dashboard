'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Laboratory } from '@/lib/types/database';
import { Building2, Plus, Eye, Edit, DollarSign } from 'lucide-react';

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'trial'>(
    'all',
  );
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'current' | 'overdue'>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markPaidModalLab, setMarkPaidModalLab] = useState<Laboratory | null>(null);
  const [markPaidNextDate, setMarkPaidNextDate] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);
  const [markPaidLoadingDate, setMarkPaidLoadingDate] = useState(false);
  
  // Ref para mantener el filtro actual en el callback de realtime
  const filterRef = useRef(filter);
  
  // Actualizar el ref cuando cambia el filtro
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  // Efecto para cargar datos cuando cambia el filtro (vía API para evitar RLS en cliente)
  useEffect(() => {
    const loadLaboratories = async () => {
      setLoading(true);
      try {
        const url = filter === 'all' ? '/api/laboratories' : `/api/laboratories?status=${filter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al cargar clientes');
        const json = await res.json();
        const data = json.data ?? [];
        setLaboratories(data.sort((a: Laboratory, b: Laboratory) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadLaboratories();
  }, [filter]);

  // Realtime: si RLS en laboratories restringe SELECT, el canal podría no recibir filas; entonces usar solo carga vía API.
  useEffect(() => {
    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('laboratories-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'laboratories',
        },
        (payload) => {
          console.log('🔔 Cambio detectado:', payload.eventType, payload);
          
          const currentFilter = filterRef.current;
          
          if (payload.eventType === 'INSERT') {
            // Agregar nuevo laboratorio si cumple con el filtro
            const newLab = payload.new as Laboratory;
            if (currentFilter === 'all' || newLab.status === currentFilter) {
              setLaboratories((prev) => {
                // Evitar duplicados
                if (prev.some((lab) => lab.id === newLab.id)) {
                  return prev;
                }
                // Agregar al inicio y ordenar por fecha
                return [newLab, ...prev].sort(
                  (a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Actualizar laboratorio existente
            const updatedLab = payload.new as Laboratory;
            setLaboratories((prev) => {
              const index = prev.findIndex((lab) => lab.id === updatedLab.id);
              
              // Si existe y cumple con el filtro, actualizar
              if (index !== -1 && (currentFilter === 'all' || updatedLab.status === currentFilter)) {
                const updated = [...prev];
                updated[index] = updatedLab;
                return updated;
              }
              
              // Si existe pero ya no cumple el filtro, remover
              if (index !== -1 && currentFilter !== 'all' && updatedLab.status !== currentFilter) {
                return prev.filter((lab) => lab.id !== updatedLab.id);
              }
              
              // Si no existe pero cumple el filtro, agregar
              if (index === -1 && (currentFilter === 'all' || updatedLab.status === currentFilter)) {
                return [updatedLab, ...prev].sort(
                  (a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              }
              
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            // Eliminar laboratorio
            const deletedLab = payload.old as Laboratory;
            setLaboratories((prev) => prev.filter((lab) => lab.id !== deletedLab.id));
          }
        },
      )
      .subscribe();

    // Limpiar suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Solo se ejecuta una vez al montar el componente
  
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      trial: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getPaymentStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const styles = {
      current: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    const s = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    const label = status === 'current' ? 'Al día' : status === 'overdue' ? 'Vencido' : status;
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s}`}>{label}</span>;
  };

  const filteredByPayment = paymentFilter === 'all'
    ? laboratories
    : laboratories.filter((lab) => (lab.payment_status ?? 'current') === paymentFilter);

  const openMarkPaidModal = async (lab: Laboratory) => {
    if (lab.status !== 'inactive' && lab.renewal_day_of_month == null) {
      alert('Configure el día de renovación en Editar para poder marcar como pagado (laboratorio activo).');
      return;
    }
    setMarkPaidLoadingDate(true);
    setMarkPaidModalLab(lab);
    setMarkPaidNextDate(null);
    setMarkPaidError(null);
    try {
      const res = await fetch(`/api/laboratories/${lab.id}/next-payment-date`);
      const json = await res.json();
      if (!res.ok) {
        setMarkPaidNextDate(null);
        setMarkPaidError(json.error ?? 'Error al obtener próxima fecha');
        return;
      }
      setMarkPaidNextDate(json.next_payment_date ?? null);
      setMarkPaidError(null);
    } catch (e) {
      console.error(e);
      setMarkPaidModalLab(null);
      setMarkPaidError(null);
      alert('Error al obtener próxima fecha');
    } finally {
      setMarkPaidLoadingDate(false);
    }
  };

  const confirmMarkPaid = async () => {
    if (!markPaidModalLab) return;
    const lab = markPaidModalLab;
    setMarkPaidModalLab(null);
    setMarkPaidNextDate(null);
    setMarkPaidError(null);
    setMarkingId(lab.id);
    try {
      const res = await fetch(`/api/laboratories/${lab.id}/mark-paid`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? 'Error al marcar como pagado');
        return;
      }
      const updated = json.data as Laboratory;
      setLaboratories((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
    } catch (e) {
      console.error(e);
      alert('Error al marcar como pagado');
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return <div className='text-gray-600'>Cargando clientes...</div>;
  }
  
  return (
    <div className='min-w-0'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8'>
        <div className='min-w-0'>
          <div className='flex items-center gap-3 mb-2'>
            <Building2 className='w-7 h-7 sm:w-8 sm:h-8 text-gray-700 shrink-0' />
            <h1 className='text-2xl sm:text-3xl font-bold text-white drop-shadow-lg truncate'>Clientes</h1>
          </div>
          <p className='text-gray-200 mt-1 text-sm sm:text-base drop-shadow-md'>
            Gestiona todos los clientes del sistema
          </p>
        </div>
        <Link
          href='/laboratories/new'
          className='w-full sm:w-auto px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#4c87ff]/30 shrink-0'
        >
          <Plus className='w-4 h-4' />
          Crear Cliente
        </Link>
      </div>

      {/* Filtros por estado */}
      <div className='mb-3 flex flex-wrap gap-2'>
        {(['all', 'active', 'inactive', 'trial'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-[#4c87ff] text-white shadow-lg shadow-[#4c87ff]/30'
                : 'bg-black/30 backdrop-blur-md text-gray-200 hover:bg-black/40 border border-white/10'
            }`}
          >
            {status === 'all'
              ? 'Todos'
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      {/* Filtros por pago */}
      <div className='mb-4 sm:mb-6 flex flex-wrap gap-2'>
        <span className='text-sm text-gray-400 self-center mr-1'>Pago:</span>
        {(['all', 'current', 'overdue'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPaymentFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              paymentFilter === p
                ? 'bg-[#41e2b8] text-gray-900 shadow-md'
                : 'bg-black/30 backdrop-blur-md text-gray-200 hover:bg-black/40 border border-white/10'
            }`}
          >
            {p === 'all' ? 'Todos' : p === 'current' ? 'Al día' : 'Vencidos'}
          </button>
        ))}
      </div>

      {/* Tabla de Clientes */}
      <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg overflow-hidden border border-white/10 max-w-full'>
        <div className='overflow-x-auto max-w-full'>
          <table className='w-full min-w-[900px]'>
          <thead className='bg-black/40 backdrop-blur-sm'>
            <tr>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Nombre
              </th>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Slug
              </th>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Estado
              </th>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Próx. pago
              </th>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Monto (USD)
              </th>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Estado pago
              </th>
              <th className='px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Día renov.
              </th>
              <th className='px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='bg-transparent divide-y divide-white/10'>
            {filteredByPayment.length === 0 ? (
              <tr>
                <td colSpan={8} className='px-6 py-8 text-center text-gray-300'>
                  No hay clientes
                  {filter !== 'all' && ` con estado "${filter}"`}
                  {paymentFilter !== 'all' && ` con pago "${paymentFilter === 'current' ? 'Al día' : 'Vencidos'}"`}
                </td>
              </tr>
            ) : (
              filteredByPayment.map((lab) => (
                <tr key={lab.id} className='hover:bg-black/40'>
                  <td className='px-4 py-3 whitespace-nowrap'>
                    <div className='text-sm font-medium text-white'>
                      {lab.name}
                    </div>
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap'>
                    <div className='text-sm text-gray-300'>{lab.slug}</div>
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap'>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        lab.status,
                      )}`}
                    >
                      {lab.status}
                    </span>
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-300'>
                    {lab.next_payment_date
                      ? new Date(lab.next_payment_date).toLocaleDateString('en-US', {timeZone: 'UTC'})
                      : '—'}
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-300'>
                    {lab.billing_amount != null
                      ? `$${Number(lab.billing_amount).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap'>
                    {getPaymentStatusBadge(lab.payment_status)}
                    {!lab.payment_status && <span className='text-gray-500 text-xs'>—</span>}
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-300'>
                    {lab.renewal_day_of_month != null ? lab.renewal_day_of_month : '—'}
                  </td>
                  <td className='px-4 py-3 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end gap-2 flex-wrap'>
                      <button
                        type='button'
                        onClick={() => openMarkPaidModal(lab)}
                        disabled={markingId !== null || markPaidLoadingDate || (lab.status !== 'inactive' && lab.renewal_day_of_month == null)}
                        title={lab.renewal_day_of_month == null ? 'Configure día de renovación en Editar' : 'Marcar como pagado. Cada vez que marques se avanzará un período; si marcas otra vez, se suma otro.'}
                        className='bg-[#10b981] text-white px-2 py-1 rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs'
                      >
                        <DollarSign className='w-3 h-3' />
                        {markingId === lab.id ? '...' : markPaidLoadingDate && markPaidModalLab?.id === lab.id ? '...' : 'Pagado'}
                      </button>
                      <Link
                        href={`/laboratories/${lab.id}`}
                        className='bg-[#4c87ff] text-white px-3 py-1 rounded-lg hover:bg-[#3d6fe6] transition-colors flex items-center gap-1 shadow-md shadow-[#4c87ff]/30'
                      >
                        <Eye className='w-3 h-3' />
                        Ver
                      </Link>
                      <Link
                        href={`/laboratories/${lab.id}/edit`}
                        className='bg-[#41e2b8] text-white px-3 py-1 rounded-lg hover:bg-[#35c9a3] transition-colors flex items-center gap-1 shadow-md shadow-[#41e2b8]/30'
                      >
                        <Edit className='w-3 h-3' />
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <p className='mt-4 text-sm text-gray-200'>
        Total: <span className='font-semibold text-white'>{filteredByPayment.length}</span>{' '}
        cliente
        {filteredByPayment.length !== 1 && 's'}
        {paymentFilter !== 'all' && ` (filtro pago: ${paymentFilter === 'current' ? 'Al día' : 'Vencidos'})`}
      </p>

      {/* Modal: Confirmar pago */}
      {markPaidModalLab && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-white/10'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              ¿Confirmar pago?
            </h3>
            {markPaidLoadingDate ? (
              <p className='text-gray-200 mb-4'>Calculando próxima fecha...</p>
            ) : markPaidNextDate ? (
              <>
                <p className='text-gray-200 mb-2'>
                  La próxima fecha de vencimiento será{' '}
                  <strong className='text-white'>
                    {new Date(markPaidNextDate + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </strong>
                  .
                </p>
                <p className='text-sm text-gray-400 mb-6'>
                  Ten en cuenta que cada vez que marques como pagado se avanzará un período. Si marcas otra vez, se suma otro.
                </p>
                <div className='flex gap-3'>
                  <button
                    onClick={confirmMarkPaid}
                    disabled={markingId !== null}
                    className='flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                  >
                    {markingId === markPaidModalLab.id ? '...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => { setMarkPaidModalLab(null); setMarkPaidNextDate(null); }}
                    disabled={markingId !== null}
                    className='flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-black/40 transition-colors disabled:opacity-50 bg-black/20 backdrop-blur-sm cursor-pointer'
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className='text-gray-200 mb-4'>
                  {markPaidError ?? 'No se pudo obtener la próxima fecha.'}
                </p>
                {markPaidModalLab && (
                  <Link
                    href={`/laboratories/${markPaidModalLab.id}/edit`}
                    className='inline-block mb-3 px-4 py-2 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] transition-colors font-medium'
                  >
                    Ir a Editar (configurar día de renovación)
                  </Link>
                )}
                <button
                  onClick={() => { setMarkPaidModalLab(null); setMarkPaidNextDate(null); setMarkPaidError(null); }}
                  className='block w-full px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-black/40 transition-colors bg-black/20 backdrop-blur-sm cursor-pointer'
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
