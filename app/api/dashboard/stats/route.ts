import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// GET: Estadísticas del dashboard (evita RLS en cliente; uso con service_role)
export async function GET() {
  try {
    const [labs, activeLabs, users, cases] = await Promise.all([
      supabaseAdmin
        .from('laboratories')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('laboratories')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('medical_records_clean')
        .select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      totalLabs: labs.count ?? 0,
      activeLabs: activeLabs.count ?? 0,
      totalUsers: users.count ?? 0,
      totalCases: cases.count ?? 0,
    });
  } catch (error: any) {
    console.error('❌ Error al cargar estadísticas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}
