import { supabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import type { Guardian, Child, CheckIn, CheckInWithDetails, DashboardStats, AuditLog } from './types';

// ── Guardian Operations ──

export async function findGuardianByPhone(phone: string): Promise<Guardian | undefined> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (error || !data) return undefined;
  return data as Guardian;
}

export async function findGuardianByEmail(email: string): Promise<Guardian | undefined> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) return undefined;
  return data as Guardian;
}

export async function searchGuardians(query: string): Promise<Guardian[]> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .or(`phone.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(10);
  
  if (error || !data) return [];
  return data as Guardian[];
}

export async function createGuardian(data: { full_name: string; phone: string; email: string }): Promise<Guardian> {
  const id = uuidv4();
  const { data: guardian, error } = await supabase
    .from('guardians')
    .insert([{ id, ...data }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar responsável: ${error.message}`);
  return guardian as Guardian;
}

export async function updateGuardian(id: string, data: Partial<Guardian>): Promise<Guardian> {
  const { data: guardian, error } = await supabase
    .from('guardians')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar responsável: ${error.message}`);
  return guardian as Guardian;
}

// ── Children Operations ──

export async function getChildrenByGuardian(guardianId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('guardian_id', guardianId);
  
  if (error || !data) return [];
  return data as Child[];
}

export async function createChild(data: {
  guardian_id: string;
  name: string;
  age: number;
  gender: string;
  has_medical_condition: boolean;
  medical_description?: string;
  uses_medication: boolean;
  medication_description?: string;
}): Promise<Child> {
  const id = uuidv4();
  const { data: child, error } = await supabase
    .from('children')
    .insert([{ id, ...data }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar criança: ${error.message}`);
  return child as Child;
}

export async function updateChild(id: string, data: Partial<Child>): Promise<Child> {
  const { data: child, error } = await supabase
    .from('children')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar criança: ${error.message}`);
  return child as Child;
}

// ── Check-in Operations ──

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createCheckIn(data: { child_id: string; guardian_id: string }): Promise<CheckIn> {
  const id = uuidv4();
  const uniqueCode = generateUniqueCode();
  const now = new Date().toISOString();

  // Check for existing active check-in
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('child_id', data.child_id)
    .eq('status', 'active')
    .single();

  if (existing) {
    throw new Error('Esta criança já possui um check-in ativo.');
  }

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert([{
      id,
      child_id: data.child_id,
      guardian_id: data.guardian_id,
      checkin_time: now,
      consent_accepted: true,
      consent_timestamp: now,
      status: 'active',
      unique_code: uniqueCode
    }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao realizar check-in: ${error.message}`);

  await logAudit('CHECK_IN', 'checkins', id, data.guardian_id, `Check-in criado para criança ${data.child_id}`);

  return checkin as CheckIn;
}

export async function processCheckOut(checkinId: string, guardianId: string): Promise<CheckIn> {
  const now = new Date().toISOString();

  const { data: checkin, error: fetchError } = await supabase
    .from('checkins')
    .select('*')
    .eq('id', checkinId)
    .eq('status', 'active')
    .single();

  if (fetchError || !checkin) {
    throw new Error('Check-in não encontrado ou já finalizado.');
  }

  if (checkin.guardian_id !== guardianId) {
    throw new Error('Apenas o responsável cadastrado pode realizar a retirada.');
  }

  const { data: updated, error: updateError } = await supabase
    .from('checkins')
    .update({ checkout_time: now, status: 'completed' })
    .eq('id', checkinId)
    .select()
    .single();

  if (updateError) throw new Error(`Erro ao realizar check-out: ${updateError.message}`);

  await logAudit('CHECK_OUT', 'checkins', checkinId, guardianId, `Check-out realizado`);

  return updated as CheckIn;
}

export async function getActiveCheckIns(): Promise<CheckInWithDetails[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select(`
      *,
      children (name, age, gender),
      guardians (full_name, phone, email)
    `)
    .eq('status', 'active')
    .order('checkin_time', { ascending: false });

  if (error || !data) return [];
  
  // Flattening the relation data for the UI
  return data.map((item: any) => ({
    ...item,
    child_name: item.children.name,
    child_age: item.children.age,
    child_gender: item.children.gender,
    guardian_name: item.guardians.full_name,
    guardian_phone: item.guardians.phone,
    guardian_email: item.guardians.email
  })) as CheckInWithDetails[];
}

export async function getActiveCheckInsByGuardian(guardianId: string): Promise<CheckInWithDetails[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select(`
      *,
      children (name, age, gender),
      guardians (full_name, phone, email)
    `)
    .eq('status', 'active')
    .eq('guardian_id', guardianId)
    .order('checkin_time', { ascending: false });

  if (error || !data) return [];
  
  return data.map((item: any) => ({
    ...item,
    child_name: item.children.name,
    child_age: item.children.age,
    child_gender: item.children.gender,
    guardian_name: item.guardians.full_name,
    guardian_phone: item.guardians.phone,
    guardian_email: item.guardians.email
  })) as CheckInWithDetails[];
}

export async function getCheckInHistory(date?: string): Promise<CheckInWithDetails[]> {
  let queryBuilder = supabase
    .from('checkins')
    .select(`
      *,
      children (name, age, gender),
      guardians (full_name, phone, email)
    `);

  if (date) {
    queryBuilder = queryBuilder.gte('checkin_time', `${date}T00:00:00Z`).lte('checkin_time', `${date}T23:59:59Z`);
  }

  const { data, error } = await queryBuilder
    .order('checkin_time', { ascending: false })
    .limit(200);

  if (error || !data) return [];
  
  return data.map((item: any) => ({
    ...item,
    child_name: item.children.name,
    child_age: item.children.age,
    child_gender: item.children.gender,
    guardian_name: item.guardians.full_name,
    guardian_phone: item.guardians.phone,
    guardian_email: item.guardians.email
  })) as CheckInWithDetails[];
}

// ── Dashboard ──

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  const [presentCount, todayCheckins, todayCheckouts, activeList] = await Promise.all([
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).gte('checkin_time', `${today}T00:00:00Z`),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('checkout_time', `${today}T00:00:00Z`),
    getActiveCheckIns()
  ]);

  return {
    presentChildren: presentCount.count || 0,
    totalCheckinsToday: todayCheckins.count || 0,
    totalCheckoutsToday: todayCheckouts.count || 0,
    activeCheckins: activeList,
  };
}

// ── Audit ──

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  guardianId?: string,
  details?: string,
  ipAddress?: string
): Promise<void> {
  await supabase
    .from('audit_logs')
    .insert([{
      action,
      entity_type: entityType,
      entity_id: entityId,
      guardian_id: guardianId || null,
      details: details || null,
      ip_address: ipAddress || null
    }]);
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) return [];
  return data as AuditLog[];
}
