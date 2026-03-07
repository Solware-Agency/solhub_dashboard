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
 * Usa get_next_payment_date_on_mark_paid(lab_id):
 * - Lab inactivo: próximo vencimiento = hoy + 1 período (monthly/weekly/yearly), renewal_day = día de hoy.
 * - Lab activo: próximo día fijo de renovación; no se cambia renewal_day_of_month.
 * Actualiza: status, payment_status, next_payment_date, renewal_day_of_month (COALESCE con el nuevo si pagó tarde).
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
      .select('id, renewal_day_of_month')
      .eq('id', id)
      .single();

    if (fetchError || !lab) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      );
    }

    const { data: rpcRows, error: rpcError } = await supabaseAdmin.rpc(
      'get_next_payment_date_on_mark_paid',
      { p_lab_id: id }
    );

    if (rpcError) {
      console.error('❌ Error get_next_payment_date_on_mark_paid:', rpcError);
      return NextResponse.json(
        { error: 'Error al calcular próxima fecha de pago' },
        { status: 500 }
      );
    }

    const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    const nextPaymentDate = row?.next_payment_date;
    const renewalDayNew = row?.renewal_day_of_month_new;

    if (nextPaymentDate == null) {
      return NextResponse.json(
        {
          error:
            'No se pudo calcular la próxima fecha. Si el laboratorio está activo, configure el día de renovación (1-31) en la edición del cliente.',
        },
        { status: 400 }
      );
    }

    const nextDateStr =
      typeof nextPaymentDate === 'string'
        ? nextPaymentDate.slice(0, 10)
        : nextPaymentDate;

    const renewalToSet =
      renewalDayNew != null ? renewalDayNew : lab.renewal_day_of_month;

    const updatePayload: Record<string, unknown> = {
      status: 'active',
      payment_status: 'current',
      next_payment_date: nextDateStr,
    };
    if (renewalToSet != null) {
      updatePayload.renewal_day_of_month = renewalToSet;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('laboratories')
      .update(updatePayload)
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
