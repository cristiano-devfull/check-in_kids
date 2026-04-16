import { NextRequest, NextResponse } from 'next/server';
import { findGuardianByPhone, findGuardianByEmail, createGuardian, updateGuardian } from '@/lib/services';
import { getUserOrganization } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, phone, email, org_id: bodyOrgId } = body;
    
    // Admins logados usam sua própria org, usuários públicos usam org_id do corpo
    const adminOrgId = await getUserOrganization();
    const orgId = adminOrgId || bodyOrgId;

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organização não identificada.' }, { status: 400 });
    }

    if (!full_name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome, telefone e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    // Tenta encontrar se já existe na organização
    let guardian = await findGuardianByPhone(orgId, phone);
    if (!guardian) {
      guardian = await findGuardianByEmail(orgId, email);
    }

    if (guardian) {
      // Atualiza se necessário
      const updated = await updateGuardian(orgId, guardian.id, { full_name, email });
      return NextResponse.json({ success: true, data: updated });
    }

    const newGuardian = await createGuardian(orgId, { full_name, phone, email });
    return NextResponse.json({ success: true, data: newGuardian }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const query = searchParams.get('query');
    const publicOrgId = searchParams.get('org_id');

    const adminOrgId = await getUserOrganization();
    const orgId = adminOrgId || publicOrgId;

    if (!orgId) {
       return NextResponse.json({ success: false, error: 'Organização não identificada.' }, { status: 400 });
    }

    if (phone) {
      const guardian = await findGuardianByPhone(orgId, phone);
      return NextResponse.json({ success: true, data: guardian });
    }

    if (email) {
      const guardian = await findGuardianByEmail(orgId, email);
      return NextResponse.json({ success: true, data: guardian });
    }

    return NextResponse.json({ success: false, error: 'Parâmetro de busca não fornecido.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
