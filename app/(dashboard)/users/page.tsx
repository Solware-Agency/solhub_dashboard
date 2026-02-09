'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Search } from 'lucide-react'

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
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [filter, setFilter] = useState({
    laboratory: 'all',
    role: 'all',
    status: 'all',
    search: '',
  });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadAvailableRoles();
  }, [filter]);

  const loadAvailableRoles = async () => {
    try {
      // Obtener todos los available_roles de todos los laboratorios
      const { data, error } = await supabase
        .from('laboratories')
        .select('available_roles')
        .not('available_roles', 'is', null);

      if (error) throw error;

      // Unir todos los arrays y eliminar duplicados
      const allRoles = new Set<string>();
      data?.forEach((lab: any) => {
        if (Array.isArray(lab.available_roles)) {
          lab.available_roles.forEach((role: string) => allRoles.add(role));
        }
      });

      setAvailableRoles(Array.from(allRoles).sort());
      console.log('✅ Roles disponibles cargados:', Array.from(allRoles).sort());
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback a roles comunes si falla
      setAvailableRoles(['owner', 'admin', 'employee', 'patologo', 'residente']);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Llamar a la API Route para obtener usuarios con service_role
      const response = await fetch('/api/users');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar usuarios');
      }

      let filteredData = result.data || [];

      // Aplicar filtros en el cliente
      if (filter.laboratory !== 'all') {
        filteredData = filteredData.filter(
          (user: any) => user.laboratory?.slug === filter.laboratory
        );
      }

      if (filter.role !== 'all') {
        filteredData = filteredData.filter(
          (user: any) => user.role === filter.role
        );
      }

      if (filter.status !== 'all') {
        filteredData = filteredData.filter(
          (user: any) => user.estado === filter.status
        );
      }

      // Filtro de búsqueda
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredData = filteredData.filter(
          (user: any) =>
            user.email?.toLowerCase().includes(searchLower) ||
            user.display_name?.toLowerCase().includes(searchLower) ||
            user.laboratory?.name?.toLowerCase().includes(searchLower),
        );
      }

      console.log('✅ Usuarios cargados:', filteredData.length);
      setUsers(filteredData as UserWithLab[]);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error al cargar usuarios: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener clientes únicos para el filtro
  const uniqueLabs = Array.from(
    new Set(users.map((u) => JSON.stringify(u.laboratory))),
  )
    .map((l) => JSON.parse(l))
    .filter((l) => l);

  // Obtener roles únicos
  const uniqueRoles = Array.from(new Set(users.map((u) => u.role)));

  const getStatusBadge = (status: string) => {
    return status === 'aprobado'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar rol');
      }

      const result = await response.json();

      // Actualizar usuario en la lista
      setUsers(users.map(u => u.id === userId ? result.data : u));
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
      // Recargar usuarios en caso de error
      loadUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return <div className='text-gray-200'>Cargando usuarios...</div>;
  }

  return (
    <div className='min-w-0'>
      <div className='mb-6 sm:mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <Users className='w-7 h-7 sm:w-8 sm:h-8 text-white shrink-0' />
          <h1 className='text-2xl sm:text-3xl font-bold text-white drop-shadow-lg'>Usuarios Global</h1>
        </div>
        <p className='text-gray-200 mt-1 text-sm sm:text-base drop-shadow-md'>
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
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder='Email, nombre...'
                className='w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white placeholder-gray-400'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-200 mb-2'>
              Rol
            </label>
            <select
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className='w-full px-3 py-2 border border-white/20 rounded-lg bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 text-white'
            >
              <option value='all'>Todos</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-200 mb-2'>
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
            <label className='block text-sm font-medium text-gray-200 mb-2'>
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
              {uniqueLabs.map((lab) => (
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
          <p className='text-2xl font-bold text-white'>{users.length}</p>
        </div>
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-green-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Aprobados</p>
          <p className='text-2xl font-bold text-green-400'>
            {users.filter((u) => u.estado === 'aprobado').length}
          </p>
        </div>  <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase'>
                  Acciones
                </th>
              
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-orange-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Pendientes</p>
          <p className='text-2xl font-bold text-yellow-600'>
            {users.filter((u) => u.estado === 'pendiente').length}
          </p>
        </div>
        <div className='bg-black/30 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/10 hover:border-[#4c87ff]/50 hover:shadow-xl transition-all duration-200 cursor-pointer'>
          <p className='text-sm text-gray-300'>Clientes</p>
          <p className='text-2xl font-bold text-[#4c87ff]'>
            {uniqueLabs.length}
          </p>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg overflow-hidden border border-white/10 max-w-full'>
        <div className='overflow-x-auto max-w-full'>
          <table className='w-full min-w-[720px]'>
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
              </tr>
            </thead>
            <tbody className='divide-y divide-white/10'>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                        {availableRoles.length > 0 ? (
                          availableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))
                        ) : (
                          <option value={user.role}>{user.role}</option>
                        )}
                      </select>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {user.assigned_branch || '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(
                          user.estado,
                        )}`}
                      >
                        {user.estado}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-300'>
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
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

