export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Member {
  id: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  membershipStart: string;
  membershipEnd: string;
  createdAt?: string;
}

export interface Fingerprint {
  id: number;
  memberId: number;
  fingerprintId: number;
  fingerName: string;
  active: boolean;
  member?: Member;
}

export interface Membership {
  id: number;
  memberId: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  member?: Member;
  createdAt?: string;
}

export interface AttendanceLog {
  id: number;
  memberId?: number;
  fingerprintId?: number;
  deviceId?: string;
  type: string;
  accessGranted: boolean;
  message: string;
  member?: Member;
  createdAt: string;
}

export interface Device {
  id: number;
  deviceId: string;
  name: string;
  location?: string | null;
  status: string;
  apiKey: string;
  createdAt?: string;
}

export interface AccessResponse {
  access: boolean;
  message: string;
  member?: Partial<Member>;
  deviceId?: string | null;
  type?: string;
}
