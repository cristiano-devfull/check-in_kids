import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getUserOrganization } from '@/utils/supabase/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const baseUrl = searchParams.get('baseUrl') || 'http://localhost:3000';
    
    const orgId = await getUserOrganization();
    
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', orgId)
      .single();
    
    const orgName = orgData?.name || 'CheckKids';
    const logoUrl = orgData?.logo_url || null;

    if (type !== 'checkin' && type !== 'checkout') {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use "checkin" ou "checkout".' },
        { status: 400 }
      );
    }

    const url = type === 'checkin'
      ? `${baseUrl}/checkin?orgId=${orgId}`
      : `${baseUrl}/checkout?orgId=${orgId}`;

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1A1A2E',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    return NextResponse.json({
      success: true,
      data: {
        type,
        url,
        qrCode: qrDataUrl,
        orgName,
        logoUrl,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar QR Code.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
