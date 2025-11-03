'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

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
    <div>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-2'>
          Bienvenido al panel administrativo de Solhub
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Clientes'
          value={stats.totalLabs}
          icon='🏥'
          description='Clientes registrados'
          color='blue'
        />
        <StatCard
          title='Labs Activos'
          value={stats.activeLabs}
          icon='✅'
          description='Clientes en operación'
          color='green'
        />
        <StatCard
          title='Total Usuarios'
          value={stats.totalUsers}
          icon='👥'
          description='Usuarios en el sistema'
          color='purple'
        />
        <StatCard
          title='Total Casos'
          value={stats.totalCases}
          icon='📋'
          description='Casos médicos procesados'
          color='orange'
        />
      </div>

      <div className='mt-8 bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          Acciones Rápidas
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <QuickActionCard
            title='Crear Cliente'
            description='Agregar un nuevo cliente al sistema'
            icon='➕'
            href='/laboratories/new'
          />
          <QuickActionCard
            title='Generar Tipos'
            description='Actualizar tipos TypeScript del sistema'
            icon='📝'
            href='/types-generator'
          />
          <QuickActionCard
            title='Gestionar Features'
            description='Habilitar/deshabilitar features por cliente'
            icon='🚩'
            href='/features'
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <div className='flex items-center justify-between mb-4'>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          <span className='text-2xl'>{icon}</span>
        </div>
      </div>
      <p className='text-gray-600 text-sm mb-1'>{title}</p>
      <p className='text-3xl font-bold text-gray-900 mb-2'>
        {value.toLocaleString()}
      </p>
      <p className='text-sm text-gray-500'>{description}</p>
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
  icon: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className='block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all'
    >
      <div className='flex items-start gap-3'>
        <span className='text-2xl'>{icon}</span>
        <div>
          <h3 className='font-semibold text-gray-900 mb-1'>{title}</h3>
          <p className='text-sm text-gray-600'>{description}</p>
        </div>
      </div>
    </a>
  );
}
