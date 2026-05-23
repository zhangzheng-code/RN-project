export interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  employee_id?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Device {
  id: number;
  name: string;
  model?: string;
  serial_number?: string;
  category_id: number | null;
  assigned_to: number | null;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  purchase_date?: string;
  notes?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  token: string;
  username: string;
}