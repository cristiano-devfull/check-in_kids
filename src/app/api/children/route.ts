import { NextRequest, NextResponse } from 'next/server';
import { createChild, getChildrenByGuardian, updateChild } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guardian_id, name, age, gender, has_medical_condition, medical_description, uses_medication, medication_description } = body;

    if (!guardian_id || !name || age === undefined || !gender) {
      return NextResponse.json(
        { success: false, error: 'Dados da criança são obrigatórios.' },
        { status: 400 }
      );
    }

    if (age < 0 || age > 17) {
      return NextResponse.json(
        { success: false, error: 'Idade inválida.' },
        { status: 400 }
      );
    }

    const child = await createChild({
      guardian_id,
      name,
      age: Number(age),
      gender,
      has_medical_condition: Boolean(has_medical_condition),
      medical_description: medical_description || undefined,
      uses_medication: Boolean(uses_medication),
      medication_description: medication_description || undefined,
    });

    return NextResponse.json({ success: true, data: child }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guardianId = searchParams.get('guardian_id');

    if (!guardianId) {
      return NextResponse.json({ success: false, error: 'ID do responsável é necessário.' }, { status: 400 });
    }

    const children = await getChildrenByGuardian(guardianId);
    return NextResponse.json({ success: true, data: children });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da criança é necessário.' }, { status: 400 });
    }

    const child = updateChild(id, data);
    return NextResponse.json({ success: true, data: child });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
