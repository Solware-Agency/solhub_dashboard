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
  const [filter, setFilter] = useState({
    laboratory: 'all',
    role: 'all',
    status: 'all',
    search: '',
  });

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*, laboratory:laboratories(name, slug)')
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

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Filtro de búsqueda en el cliente
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredData = filteredData.filter(
          (user) =>
            user.email?.toLowerCase().includes(searchLower) ||
            user.display_name?.toLowerCase().includes(searchLower) ||
            (user.laboratory as any)?.name?.toLowerCase().includes(searchLower),
        );
      }

      setUsers(filteredData as UserWithLab[]);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error al cargar usuarios');
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

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-[#4c87ff]/20 text-[#4c87ff] border border-[#4c87ff]/30',
      employee: 'bg-gray-100 text-gray-800',
      patologo: 'bg-green-100 text-green-800',
      residente: 'bg-yellow-100 text-yellow-800',
      citotecno: 'bg-orange-100 text-orange-800',
      medicowner: 'bg-indigo-100 text-indigo-800',
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    return status === 'aprobado'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

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
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder='Email, nombre...'
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
              {uniqueRoles.map((role) => (
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
        </div>
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
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadge(
                          user.role,
                        )}`}
                      >
                        {user.role}
                      </span>
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

