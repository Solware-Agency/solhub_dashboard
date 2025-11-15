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
import SOLWY from '../components/SOLWY';

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
    <div className='h-full flex flex-col overflow-visible'>
      <div className='mb-6 flex-shrink-0 relative overflow-visible'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-white drop-shadow-lg'>Dashboard</h1>
            <p className='text-gray-200 mt-2 drop-shadow-md'>
              Bienvenido al panel administrativo de Solhub
            </p>
          </div>
          <div 
            className='relative flex items-center justify-center'
            style={{ 
              width: '150px', 
              height: '150px',
              marginRight: '-1rem',
              marginTop: '-3rem',
              marginBottom: '-3rem'
            }}
          >
            <div 
              className='absolute inset-0 bg-gradient-to-r from-[#4c87ff] to-[#41e2b8] rounded-full blur-2xl opacity-40 animate-pulse'
              style={{ 
                width: '100%', 
                height: '100%'
              }}
            ></div>
            <div className='relative z-10'>
              <SOLWY className='w-24 h-24' />
            </div>
          </div>
        </div>
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

        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 flex-shrink-0 border border-white/10'>
          <h2 className='text-xl font-semibold text-white mb-4'>
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
    blue: 'bg-[#4c87ff]/20 text-[#4c87ff] border border-[#4c87ff]/30',
    green: 'bg-[#41e2b8]/20 text-[#41e2b8] border border-[#41e2b8]/30',
    purple: 'bg-[#29536b]/20 text-[#29536b] border border-[#29536b]/30',
    orange: 'bg-[#4c87ff]/20 text-[#4c87ff] border border-[#4c87ff]/30',
  };

  return (
    <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 border border-white/10 hover:border-[#4c87ff]/50 hover:shadow-xl transition-all cursor-pointer'>
      <div className='flex items-center gap-4'>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]} shadow-sm`}
        >
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-gray-200 text-sm mb-1 font-medium'>{title}</p>
          <p className='text-3xl font-bold text-white'>
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
      className='block p-4 border border-white/10 rounded-lg bg-black/30 backdrop-blur-md hover:border-[#4c87ff]/50 hover:bg-black/40 hover:shadow-lg transition-all'
    >
      <div className='flex items-start gap-3'>
        <div className='text-[#4c87ff] mt-0.5'>{icon}</div>
        <div>
          <h3 className='font-semibold text-white mb-1'>{title}</h3>
          <p className='text-sm text-gray-300'>{description}</p>
        </div>
      </div>
    </a>
  );
}
