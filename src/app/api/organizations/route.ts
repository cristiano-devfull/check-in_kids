import { NextRequest, NextResponse } from 'next/server';
import { updateOrganization, getOrganization } from '@/lib/services';
import { getUserOrganization } from '@/utils/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const orgId = await getUserOrganization();
    
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, logo_url } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'O nome da organização é obrigatório.' }, { status: 400 });
    }

    const updated = await updateOrganization(orgId, { name, logo_url });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orgId = await getUserOrganization();
    
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const org = await getOrganization(orgId);
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao carregar dados.' }, { status: 500 });
  }
}
