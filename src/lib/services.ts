import { supabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Guardian, 
  Child, 
  CheckIn, 
  CheckInWithDetails, 
  DashboardStats, 
  AuditLog,
  Profile,
  Organization
} from './types';

// ── Auth & Organization Helpers ──

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) return null;
  return data as Profile;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  
  if (error || !data) return null;
  return data as Organization;
}

export async function updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization> {
  const { data: org, error } = await supabase
    .from('organizations')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar organização: ${error.message}`);
  return org as Organization;
}

// ── Guardian Operations ──

export async function findGuardianByPhone(orgId: string, phone: string): Promise<Guardian | undefined> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('organization_id', orgId)
    .eq('phone', phone)
    .single();
  
  if (error || !data) return undefined;
  return data as Guardian;
}

export async function findGuardianByEmail(orgId: string, email: string): Promise<Guardian | undefined> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('organization_id', orgId)
    .eq('email', email)
    .single();
  
  if (error || !data) return undefined;
  return data as Guardian;
}

export async function searchGuardians(orgId: string, query: string): Promise<Guardian[]> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('organization_id', orgId)
    .or(`phone.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(10);
  
  if (error || !data) return [];
  return data as Guardian[];
}

export async function createGuardian(orgId: string, data: { full_name: string; phone: string; email: string }): Promise<Guardian> {
  const id = uuidv4();
  const { data: guardian, error } = await supabase
    .from('guardians')
    .insert([{ id, organization_id: orgId, ...data }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar responsável: ${error.message}`);
  return guardian as Guardian;
}

export async function updateGuardian(orgId: string, id: string, data: Partial<Guardian>): Promise<Guardian> {
  const { data: guardian, error } = await supabase
    .from('guardians')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar responsável: ${error.message}`);
  return guardian as Guardian;
}

// ── Children Operations ──

export async function getChildrenByGuardian(orgId: string, guardianId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('organization_id', orgId)
    .eq('guardian_id', guardianId);
  
  if (error || !data) return [];
  return data as Child[];
}

export async function createChild(orgId: string, data: {
  guardian_id: string;
  name: string;
  age: number;
  gender: string;
  has_medical_condition: boolean;
  medical_description?: string;
  uses_medication: boolean;
  medication_description?: string;
}): Promise<Child> {
  // Check for subscription quota (max_children)
  const { data: org } = await supabase
    .from('organizations')
    .select('max_children')
    .eq('id', orgId)
    .single();

  const { count: currentChildren } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (org?.max_children && (currentChildren || 0) >= org.max_children) {
    throw new Error(`Limite de crianças atingido para o seu plano (${org.max_children}). Faça upgrade para cadastrar mais.`);
  }

  const id = uuidv4();
  const { data: child, error } = await supabase
    .from('children')
    .insert([{ id, organization_id: orgId, ...data }])
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar criança: ${error.message}`);
  return child as Child;
}

export async function updateChild(orgId: string, id: string, data: Partial<Child>): Promise<Child> {
  const { data: child, error } = await supabase
    .from('children')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)
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

export async function createCheckIn(orgId: string, data: { child_id: string; guardian_id: string }): Promise<CheckIn> {
  const id = uuidv4();
  const uniqueCode = generateUniqueCode();
  const now = new Date().toISOString();

  // Check for subscription quota (max_active_checkins)
  const [{ data: org }, { count: currentActive }] = await Promise.all([
    supabase.from('organizations').select('max_active_checkins').eq('id', orgId).single(),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active')
  ]);

  if (org?.max_active_checkins && (currentActive || 0) >= org.max_active_checkins) {
    throw new Error(`Limite de check-ins ativos simultâneos atingido (${org.max_active_checkins}). Faça upgrade para aceitar mais crianças.`);
  }

  // Check for existing active check-in in THIS organization
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('organization_id', orgId)
    .eq('child_id', data.child_id)
    .eq('status', 'active')
    .single();

  if (existing) {
    throw new Error('Esta criança já possui um check-in ativo neste estabelecimento.');
  }

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert([{
      id,
      organization_id: orgId,
      child_id: data.child_id,
      guardian_id: data.guardian_id,
      checkin_time: now,
      consent_accepted: true,
      consent_timestamp: now,
      status: 'active',
      unique_code: uniqueCode
    }])
    .select()
    .maybeSingle();

  if (error) throw new Error(`Erro ao realizar check-in: ${error.message}`);

  // Fallback if RLS prevents selecting the newly created row
  const result = checkin || {
    id,
    organization_id: orgId,
    child_id: data.child_id,
    guardian_id: data.guardian_id,
    checkin_time: now,
    status: 'active',
    unique_code: uniqueCode,
    consent_accepted: true,
    consent_timestamp: now,
    created_at: now
  } as CheckIn;

  await logAudit(orgId, 'CHECK_IN', 'checkins', id, data.guardian_id, `Check-in criado p/ criança ${data.child_id}`);

  return result;
}

export async function processCheckOut(orgId: string, checkinId: string, guardianId: string): Promise<CheckIn> {
  const now = new Date().toISOString();

  const { data: checkin, error: fetchError } = await supabase
    .from('checkins')
    .select('*')
    .eq('id', checkinId)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  if (fetchError || !checkin) {
    throw new Error('Check-in não encontrado ou já finalizado.');
  }

  if (checkin.guardian_id !== guardianId) {
    throw new Error('Apenas o responsável cadastrado pode realizar a retirada.');
  }

  const { data: updated, error: updateError, count } = await supabase
    .from('checkins')
    .update({ checkout_time: now, status: 'completed' }, { count: 'exact' })
    .eq('id', checkinId)
    .eq('organization_id', orgId)
    .select()
    .maybeSingle();

  if (updateError) throw new Error(`Erro ao realizar check-out: ${updateError.message}`);

  if (count === 0) {
    throw new Error('Não foi possível registrar a saída. O registro não foi encontrado ou já foi finalizado.');
  }

  await logAudit(orgId, 'CHECK_OUT', 'checkins', checkinId, guardianId, `Check-out realizado`);

  // Fallback if RLS prevents reading the completed row (but we know count > 0)
  return (updated || { ...checkin, checkout_time: now, status: 'completed' }) as CheckIn;
}

export async function getActiveCheckIns(orgId: string): Promise<CheckInWithDetails[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select(`
      *,
      children (name, age, gender),
      guardians (full_name, phone, email)
    `)
    .eq('organization_id', orgId)
    .eq('status', 'active')
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

export async function getActiveCheckInsByGuardian(orgId: string, guardianId: string): Promise<CheckInWithDetails[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select(`
      *,
      children (name, age, gender),
      guardians (full_name, phone, email)
    `)
    .eq('organization_id', orgId)
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

export async function getCheckInHistory(orgId: string, date?: string): Promise<CheckInWithDetails[]> {
  let queryBuilder = supabase
    .from('checkins')
    .select(`
      *,
      children (name, age, gender),
      guardians (full_name, phone, email)
    `)
    .eq('organization_id', orgId);

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

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  const [presentCount, todayCheckins, todayCheckouts, activeList, childrenCount] = await Promise.all([
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('checkin_time', `${today}T00:00:00Z`),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed').gte('checkout_time', `${today}T00:00:00Z`),
    getActiveCheckIns(orgId),
    supabase.from('children').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
  ]);

  return {
    presentChildren: presentCount.count || 0,
    totalCheckinsToday: todayCheckins.count || 0,
    totalCheckoutsToday: todayCheckouts.count || 0,
    activeCheckins: activeList,
    totalChildren: childrenCount.count || 0
  };
}

// ── Audit ──

export async function logAudit(
  orgId: string,
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
      organization_id: orgId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      guardian_id: guardianId || null,
      details: details || null,
      ip_address: ipAddress || null
    }]);
}

export async function getAuditLogs(orgId: string, limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) return [];
  return data as AuditLog[];
}
