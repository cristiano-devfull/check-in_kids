import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const baseUrl = searchParams.get('baseUrl') || 'http://localhost:3000';

    if (type !== 'checkin' && type !== 'checkout') {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use "checkin" ou "checkout".' },
        { status: 400 }
      );
    }

    const url = type === 'checkin'
      ? `${baseUrl}/checkin`
      : `${baseUrl}/checkout`;

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
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar QR Code.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
