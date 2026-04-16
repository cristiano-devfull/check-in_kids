import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckIn,
  processCheckOut,
  getActiveCheckIns,
  getActiveCheckInsByGuardian,
  getCheckInHistory,
} from '@/lib/services';
import { getUserOrganization } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, child_id, guardian_id, checkin_id, org_id } = body;

    // Em um fluxo multi-tenant, o org_id é obrigatório para operações públicas
    if (!org_id) {
      return NextResponse.json(
        { success: false, error: 'ID da organização é obrigatório.' },
        { status: 400 }
      );
    }

    if (action === 'checkin') {
      if (!child_id || !guardian_id) {
        return NextResponse.json(
          { success: false, error: 'ID da criança e do responsável são obrigatórios.' },
          { status: 400 }
        );
      }

      const checkin = await createCheckIn(org_id, { child_id, guardian_id });
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

      const checkin = await processCheckOut(org_id, checkin_id, guardian_id);
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
    const publicOrgId = searchParams.get('org_id'); // Usado para buscas públicas (QR)

    // Determina o orgId com base no contexto (Admin logado ou público via scan)
    const adminOrgId = await getUserOrganization();
    const orgId = adminOrgId || publicOrgId;

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Acesso negado. Organização não identificada.' }, { status: 401 });
    }

    if (type === 'active') {
      const data = guardianId ? await getActiveCheckInsByGuardian(orgId, guardianId) : await getActiveCheckIns(orgId);
      return NextResponse.json({ success: true, data });
    }

    if (type === 'history') {
      // Histórico é SEMPRE uma operação administrativa, exige adminOrgId
      if (!adminOrgId) {
        return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
      }
      const data = await getCheckInHistory(orgId, date || undefined);
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
