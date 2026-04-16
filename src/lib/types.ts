export interface Guardian {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  guardian_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  has_medical_condition: boolean;
  medical_description?: string;
  uses_medication: boolean;
  medication_description?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  child_id: string;
  guardian_id: string;
  checkin_time: string;
  checkout_time?: string;
  consent_accepted: boolean;
  consent_timestamp?: string;
  status: 'active' | 'completed';
  unique_code: string;
  created_at: string;
}

export interface CheckInWithDetails extends CheckIn {
  child_name: string;
  child_age: number;
  child_gender: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  guardian_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  presentChildren: number;
  totalCheckinsToday: number;
  totalCheckoutsToday: number;
  activeCheckins: CheckInWithDetails[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type CheckInStep = 'scan' | 'register' | 'consent' | 'confirmation';
export type CheckOutStep = 'scan' | 'identify' | 'select' | 'confirm' | 'done';
