'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Building2,
  CheckCircle2,
  Users,
  ClipboardList,
  Plus,
  FileCode,
  Flag,
} from 'lucide-react';

interface Stats {
  totalLabs: number;
  activeLabs: number;
  totalUsers: number;
  totalCases: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalLabs: 0,
    activeLabs: 0,
    totalUsers: 0,
    totalCases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [labs, activeLabs, users, cases] = await Promise.all([
        supabase
          .from('laboratories')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('laboratories')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('medical_records_clean')
          .select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalLabs: labs.count || 0,
        activeLabs: activeLabs.count || 0,
        totalUsers: users.count || 0,
        totalCases: cases.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className='text-gray-600'>Cargando estadísticas...</div>;
  }

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      <div className='mb-6 flex-shrink-0'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-2'>
          Bienvenido al panel administrativo de Solhub
        </p>
      </div>

      <div className='flex-1 flex flex-col gap-6 min-h-0'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0'>
          <StatCard
            title='Total Clientes'
            value={stats.totalLabs}
            icon={<Building2 className='w-6 h-6' />}
            color='blue'
          />
          <StatCard
            title='Labs Activos'
            value={stats.activeLabs}
            icon={<CheckCircle2 className='w-6 h-6' />}
            color='green'
          />
          <StatCard
            title='Total Usuarios'
            value={stats.totalUsers}
            icon={<Users className='w-6 h-6' />}
            color='purple'
          />
          <StatCard
            title='Total Casos'
            value={stats.totalCases}
            icon={<ClipboardList className='w-6 h-6' />}
            color='orange'
          />
        </div>

        <div className='bg-white rounded-lg shadow p-6 flex-shrink-0'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Acciones Rápidas
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <QuickActionCard
              title='Crear Cliente'
              description='Agregar un nuevo cliente al sistema'
              icon={<Plus className='w-5 h-5' />}
              href='/laboratories/new'
            />
            <QuickActionCard
              title='Generar Tipos'
              description='Actualizar tipos TypeScript del sistema'
              icon={<FileCode className='w-5 h-5' />}
              href='/types-generator'
            />
            <QuickActionCard
              title='Gestionar Features'
              description='Habilitar/deshabilitar features por cliente'
              icon={<Flag className='w-5 h-5' />}
              href='/features'
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className='bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer'>
      <div className='flex items-center gap-4'>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]} shadow-sm`}
        >
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-gray-600 text-sm mb-1 font-medium'>{title}</p>
          <p className='text-3xl font-bold text-gray-900'>
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className='block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all'
    >
      <div className='flex items-start gap-3'>
        <div className='text-blue-600 mt-0.5'>{icon}</div>
        <div>
          <h3 className='font-semibold text-gray-900 mb-1'>{title}</h3>
          <p className='text-sm text-gray-600'>{description}</p>
        </div>
      </div>
    </a>
  );
}
