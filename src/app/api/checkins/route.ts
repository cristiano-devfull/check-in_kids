import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckIn,
  processCheckOut,
  getActiveCheckIns,
  getActiveCheckInsByGuardian,
  getCheckInHistory,
} from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, child_id, guardian_id, checkin_id } = body;

    if (action === 'checkin') {
      if (!child_id || !guardian_id) {
        return NextResponse.json(
          { success: false, error: 'ID da criança e do responsável são obrigatórios.' },
          { status: 400 }
        );
      }

      const checkin = await createCheckIn({ child_id, guardian_id });
      return NextResponse.json({
        success: true,
        data: checkin,
        message: 'Check-in realizado com sucesso!',
      }, { status: 201 });
    }

    if (action === 'checkout') {
      if (!checkin_id || !guardian_id) {
        return NextResponse.json(
          { success: false, error: 'ID do check-in e do responsável são obrigatórios.' },
          { status: 400 }
        );
      }

      const checkin = await processCheckOut(checkin_id, guardian_id);
      return NextResponse.json({
        success: true,
        data: checkin,
        message: 'Check-out realizado com sucesso!',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida. Use "checkin" ou "checkout".' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const guardianId = searchParams.get('guardian_id');
    const date = searchParams.get('date');

    if (type === 'active') {
      const data = guardianId ? await getActiveCheckInsByGuardian(guardianId) : await getActiveCheckIns();
      return NextResponse.json({ success: true, data });
    }

    if (type === 'history') {
      const data = await getCheckInHistory(date || undefined);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: 'Tipo inválido. Use "active" ou "history".' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
