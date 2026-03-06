'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface UserWithLab {
  id: string
  email: string
  display_name: string | null
  role: string
  estado: string
  assigned_branch: string | null
  created_at: string
  laboratory: {
    name: string
    slug: string
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    laboratory: 'all',
    role: 'all',
    status: 'all',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Delete dialog state
  const [deleteDialogUser, setDeleteDialogUser] = useState<UserWithLab | null>(null);
  const [deleteCooldown, setDeleteCooldown] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const DELETE_COOLDOWN_SEC = 3;
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({ aprobados: 0, pendientes: 0 });
  const [allLabs, setAllLabs] = useState<{ name: string; slug: string }[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const usersPerPage = 10;
  const totalPages = Math.ceil(totalUsers / usersPerPage) || 1;

  useEffect(() => {
    loadMetadata(); // Cargar labs y roles al inicio
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Resetear a página 1 cuando cambian filtros
    loadUsers();
  }, [filter]);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  // Cooldown timer for delete confirmation
  useEffect(() => {
    if (deleteCooldown > 0) {
      const timer = setTimeout(() => setDeleteCooldown(deleteCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [deleteCooldown]);

  const loadMetadata = async () => {
    try {
      // Cargar todos los laboratorios únicos
      const { data: labsData } = await supabase
        .from('profiles')
        .select('laboratory:laboratories(name, slug)')
        .not('laboratory', 'is', null);

      if (labsData) {
        const uniqueLabsMap = new Map();
        labsData.forEach((item: any) => {
          if (item.laboratory) {
            uniqueLabsMap.set(item.laboratory.slug, item.laboratory);
          }
        });
        setAllLabs(Array.from(uniqueLabsMap.values()));
      }

      // Cargar todos los roles únicos
      const { data: rolesData } = await supabase
        .from('profiles')
        .select('role');

      if (rolesData) {
        const uniqueRolesSet = new Set(rolesData.map((r: any) => r.role));
        setAllRoles(Array.from(uniqueRolesSet).sort());
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Query base con filtros
      let query = supabase
        .from('profiles')
        .select('*, laboratory:laboratories(name, slug)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filter.laboratory !== 'all') {
        query = query.eq('laboratory_id', filter.laboratory);
      }

      if (filter.role !== 'all') {
        query = query.eq('role', filter.role);
      }

      if (filter.status !== 'all') {
        query = query.eq('estado', filter.status);
      }

      // Búsqueda por texto (se hace en servidor si es posible)
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        query = query.or(`email.ilike.%${searchLower}%,display_name.ilike.%${searchLower}%`);
      }

      // Aplicar paginación
      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      console.log('🔍 Query result:', { data, error, count, page: currentPage });

      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }

      setUsers((data || []) as UserWithLab[]);
      setTotalUsers(count || 0);

      // Cargar estadísticas de estados (aprobados/pendientes) globales
      if (currentPage === 1) {
        const { count: aprobadosCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'aprobado');

        const { count: pendientesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');

        setStats({
          aprobados: aprobadosCount || 0,
          pendientes: pendientesCount || 0,
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error al cargar usuarios: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select('*, laboratory:laboratories(name, slug)')
        .single();

      if (error) throw error;

      // Actualizar usuario en la lista
      setUsers(users.map(u => u.id === userId ? data as UserWithLab : u));
      console.log('✅ Rol actualizado:', newRole);
    } catch (error: any) {
      console.error('❌ Error al actualizar rol:', error);
      alert('Error al actualizar rol: ' + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };
  const handleEstadoChange = useCallback(
    async (userId: string, newEstado: string) => {
      setUpdatingUserId(userId);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ estado: newEstado })
          .eq('id', userId);

        if (error) throw error;

        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, estado: newEstado } : u)),
        );

        // Re-fetch stats if estado changed
        const { data: statsData, error: statsError } = await supabase
          .from('profiles')
          .select('estado', { count: 'exact', head: false });

        if (!statsError && statsData) {
          const aprobados = statsData.filter((p) => p.estado === 'aprobado').length;
          const pendientes = statsData.filter((p) => p.estado === 'pendiente').length;
          setStats({ aprobados, pendientes });
        }
      } catch (err: unknown) {
        console.error('Error updating estado:', err);
        alert('Error al actualizar el estado');
      } finally {
        setUpdatingUserId(null);
      }
    },
    [supabase],
  );
  const openDeleteDialog = useCallback((user: UserWithLab) => {
    setDeleteDialogUser(user);
    setDeleteCooldown(DELETE_COOLDOWN_SEC);
    setDeleteError(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogUser(null);
    setDeleteCooldown(0);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialogUser || deleteCooldown > 0) return;

    setDeletingUserId(deleteDialogUser.id);
    setDeleteError(null);
    try {
      // Llamar RPC directamente (usa RLS interno, no API)
      const { data, error } = await supabase.rpc('delete_user_from_auth', {
        p_user_id: deleteDialogUser.id,
      });

      if (error) {
        setDeleteError(error.message);
        return;
      }

      const result = data as { success?: boolean; error?: string; message?: string } | null;
      if (!result || result.success === false) {
        setDeleteError(result?.error || 'Error al eliminar usuario');
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteDialogUser.id));
      setTotalUsers((prev) => prev - 1);

      // If we deleted the last user on the page and we're not on page 1, go back one page
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        // Otherwise, re-fetch current page to maintain correct count
        await loadUsers();
      }

      closeDeleteDialog();
      setDeletingUserId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setDeleteError(msg);
    } finally {
      setDeletingUserId(null);
    }
  }, [deleteDialogUser, deleteCooldown, closeDeleteDialog, users.length, currentPage, loadUsers]);

  if (loading) {
    return <div className='text-gray-200'>Cargando usuarios...</div>;
  }

  return (
    <div>
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <Users className='w-8 h-8 text-white' />
          <h1 className='text-3xl font-bold text-white drop-shadow-lg'>Usuarios Global</h1>
        </div>
        <p className='text-gray-200 mt-1 drop-shadow-md'>
          Vista global de todos los usuarios del sistema
        </p>
      </div>

      {/* Filtros */}
      <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg mb-6 border border-white/10'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-200 mb-2'>
              Buscar
            </label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setFilter({ ...filter, search: searchInput });
                  }
                }}
                placeholder='Email, nombre... (presiona Enter)'
                className='w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Rol
            </label>
            <select
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white'
            >
              <option value='all'>Todos</option>
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Estado
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white'
            >
              <option value='all'>Todos</option>
              <option value='aprobado'>Aprobado</option>
              <option value='pendiente'>Pendiente</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Cliente
            </label>
            <select
              value={filter.laboratory}
              onChange={(e) =>
                setFilter({ ...filter, laboratory: e.target.value })
              }
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white'
            >
              <option value='all'>Todos</option>
              {allLabs.map((lab) => (
                <option key={lab.slug} value={lab.slug}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-purple-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Total Usuarios</p>
          <p className='text-2xl font-bold text-white'>{totalUsers}</p>
        </div>
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-green-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Aprobados</p>
          <p className='text-2xl font-bold text-green-400'>
            {stats.aprobados}
          </p>
        </div>
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-orange-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Pendientes</p>
          <p className='text-2xl font-bold text-yellow-600'>
            {stats.pendientes}
          </p>
        </div>
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-[#4c87ff]/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Clientes</p>
          <p className='text-2xl font-bold text-[#4c87ff]'>
            {allLabs.length}
          </p>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg overflow-hidden border border-white/10'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-black/40 backdrop-blur-sm'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Usuario
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Cliente
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Rol
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Sucursal
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Estado
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Fecha Registro
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-white/10'>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className='px-6 py-8 text-center text-gray-300'
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className='hover:bg-black/40'>
                    <td className='px-6 py-4'>
                      <div>
                        <div className='text-sm font-medium text-white'>
                          {user.display_name || 'Sin nombre'}
                        </div>
                        <div className='text-sm text-gray-300'>
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-white'>
                      {user.laboratory?.name || 'N/A'}
                    </td>
                    <td className='px-6 py-4'>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingUserId === user.id}
                        className='px-2 py-1 rounded text-xs font-semibold border border-white/20 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 disabled:opacity-50 cursor-pointer'
                      >
                        <option value="owner">owner</option>
                        <option value="employee">employee</option>
                        <option value="patologo">patologo</option>
                        <option value="citotecno">citotecno</option>
                        <option value="residente">residente</option>
                        <option value="enfermero">enfermero</option>
                        <option value="medico_tratante">medico_tratante</option>
                        <option value="call_center">call_center</option>
                        <option value="imagenologia">imagenologia</option>
                        <option value="laboratorio">laboratorio</option>
                        <option value="coordinador">coordinador</option>
                        <option value="prueba">prueba</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {user.assigned_branch || '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <select
                        value={user.estado}
                        onChange={(e) => handleEstadoChange(user.id, e.target.value)}
                        disabled={updatingUserId === user.id}
                        className={`px-2 py-1 rounded text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 disabled:opacity-50 cursor-pointer ${
                          user.estado === 'aprobado'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                        }`}
                      >
                        <option value="aprobado">aprobado</option>
                        <option value="pendiente">pendiente</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() => openDeleteDialog(user)}
                        disabled={deletingUserId === user.id}
                        className='p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30'
                        title='Eliminar usuario (auth + perfil)'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className='flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20'>
          <div className='text-sm text-gray-300'>
            Mostrando {users.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1} a{' '}
            {Math.min(currentPage * usersPerPage, totalUsers)} de {totalUsers} usuarios
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className='p-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              title='Página anterior'
            >
              <ChevronLeft className='w-4 h-4' />
            </button>
            <span className='text-sm text-gray-300 min-w-[100px] text-center'>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className='p-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              title='Página siguiente'
            >
              <ChevronRight className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación eliminar usuario */}
      {deleteDialogUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
          <div className='bg-gray-900 border border-white/20 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-white mb-2'>Eliminar usuario</h3>
            <p className='text-gray-300 mb-4'>
              ¿Eliminar a <strong>{deleteDialogUser.display_name || deleteDialogUser.email}</strong> ({deleteDialogUser.email})? Esta acción borra el usuario del sistema de autenticación y su perfil. No se puede deshacer.
            </p>
            {deleteError && (
              <p className='text-red-400 text-sm mb-4' role='alert'>
                {deleteError}
              </p>
            )}
            <div className='flex gap-3 justify-end'>
              <button
                type='button'
                onClick={closeDeleteDialog}
                disabled={deletingUserId === deleteDialogUser.id}
                className='px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 disabled:opacity-50'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleConfirmDelete}
                disabled={deleteCooldown > 0 || deletingUserId === deleteDialogUser.id}
                className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {deletingUserId === deleteDialogUser.id
                  ? 'Eliminando…'
                  : deleteCooldown > 0
                    ? `Confirmar (${deleteCooldown}s)`
                    : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

