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
    const { name, logo_url, subscription_tier, max_children, max_active_checkins } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (subscription_tier) updateData.subscription_tier = subscription_tier;
    if (max_children !== undefined) updateData.max_children = max_children;
    if (max_active_checkins !== undefined) updateData.max_active_checkins = max_active_checkins;

    const updated = await updateOrganization(orgId, updateData);

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
