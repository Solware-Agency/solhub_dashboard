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

/**
 * GET: Obtiene la próxima fecha de vencimiento que se asignaría al marcar como pagado.
 * Usa la misma RPC get_next_payment_date_on_mark_paid para el preview del modal.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const { data: rpcRows, error: rpcError } = await supabaseAdmin.rpc(
      'get_next_payment_date_on_mark_paid',
      { p_lab_id: id }
    );

    if (rpcError) {
      console.error('❌ Error get_next_payment_date_on_mark_paid (preview):', rpcError);
      return NextResponse.json(
        { error: 'Error al calcular próxima fecha de pago' },
        { status: 500 }
      );
    }

    const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    const nextPaymentDate = row?.next_payment_date;

    if (nextPaymentDate == null) {
      return NextResponse.json(
        {
          error:
            'No se pudo calcular la próxima fecha. Configure el día de renovación (1-31) en la edición del cliente.',
        },
        { status: 400 }
      );
    }

    const nextDateStr =
      typeof nextPaymentDate === 'string'
        ? nextPaymentDate.slice(0, 10)
        : nextPaymentDate;

    return NextResponse.json({ next_payment_date: nextDateStr });
  } catch (error: unknown) {
    console.error('❌ Error inesperado next-payment-date:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener fecha' },
      { status: 500 }
    );
  }
}
