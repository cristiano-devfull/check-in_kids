import { NextResponse } from 'next/server';
import type { DashboardStats, Organization } from '@/lib/types';
import { getDashboardStats, getOrganization } from '@/lib/services';
import { getUserOrganization } from '@/utils/supabase/server';

export async function GET() {
  try {
    const orgId = await getUserOrganization();
    
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organização não encontrada.' }, { status: 401 });
    }

    const [stats, org] = await Promise.all([
      getDashboardStats(orgId),
      getOrganization(orgId)
    ]);

    return NextResponse.json({ 
      success: true, 
      data: stats,
      orgName: org?.name || 'Seu Estabelecimento',
      organization: org
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
