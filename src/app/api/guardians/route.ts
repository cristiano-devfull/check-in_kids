import { NextRequest, NextResponse } from 'next/server';
import {
  createGuardian,
  findGuardianByEmail,
  findGuardianByPhone,
  searchGuardians,
  updateGuardian,
} from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, phone, email } = body;

    if (!full_name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome, telefone e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Formato de telefone inválido.' },
        { status: 400 }
      );
    }

    const existing = await findGuardianByPhone(phone);
    if (existing) {
      const updated = await updateGuardian(existing.id, { full_name, email });
      return NextResponse.json({ success: true, data: updated, message: 'Cadastro atualizado.' });
    }

    const guardian = await createGuardian({ full_name, phone, email });
    return NextResponse.json({ success: true, data: guardian, message: 'Cadastro realizado com sucesso.' }, { status: 201 });
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
    const query = searchParams.get('q');

    if (phone) {
      const guardian = findGuardianByPhone(phone);
      if (!guardian) {
        return NextResponse.json({ success: false, error: 'Responsável não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: guardian });
    }

    if (email) {
      const guardian = await findGuardianByEmail(email);
      if (!guardian) {
        return NextResponse.json({ success: false, error: 'Responsável não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: guardian });
    }

    if (query) {
      const results = await searchGuardians(query);
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json({ success: false, error: 'Parâmetro de busca necessário.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
