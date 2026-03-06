import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

/**
 * POST: Marcar laboratorio como pagado.
 * Calcula next_payment_date con get_next_payment_date(renewal_day_of_month, today).
 * Opción B: renewal_day_of_month debe estar configurado (1-31); si es mayor al último día del mes,
 * la función SQL ya devuelve el último día de ese mes.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const { data: lab, error: fetchError } = await supabaseAdmin
      .from('laboratories')
      .select('id, renewal_day_of_month, status')
      .eq('id', id)
      .single();

    if (fetchError || !lab) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      );
    }

    const renewalDay = lab.renewal_day_of_month;
    if (
      renewalDay == null ||
      typeof renewalDay !== 'number' ||
      renewalDay < 1 ||
      renewalDay > 31
    ) {
      return NextResponse.json(
        {
          error:
            'Configure el día de renovación (1-31) en la edición del cliente para poder marcar como pagado.',
        },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: nextDateResult, error: rpcError } = await supabaseAdmin.rpc(
      'get_next_payment_date',
      {
        p_renewal_day_of_month: renewalDay,
        p_from_date: today,
      }
    );

    if (rpcError) {
      console.error('❌ Error get_next_payment_date:', rpcError);
      return NextResponse.json(
        { error: 'Error al calcular próxima fecha de pago' },
        { status: 500 }
      );
    }

    const nextPaymentDate =
      typeof nextDateResult === 'string'
        ? nextDateResult.slice(0, 10)
        : nextDateResult;
    if (!nextPaymentDate) {
      return NextResponse.json(
        { error: 'No se pudo calcular la próxima fecha de pago' },
        { status: 500 }
      );
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('laboratories')
      .update({
        status: 'active',
        payment_status: 'current',
        next_payment_date: nextPaymentDate,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar laboratorio:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    console.error('❌ Error inesperado mark-paid:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al marcar como pagado' },
      { status: 500 }
    );
  }
}
