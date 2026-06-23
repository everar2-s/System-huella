export type MemberStatus = 'PENDING_FINGERPRINT' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'INACTIVE';

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'RECEPTIONIST';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface Member {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  status: string;
  membershipStart?: string | null;
  membershipEnd?: string | null;
  createdAt: string;
}

export interface CreateMemberPayload {
  fullName: string;
  phone: string;
  email?: string;
}

export type UpdateMemberPayload = Partial<CreateMemberPayload>;

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  location?: string | null;
  apiKey?: string;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDevicePayload {
  deviceId: string;
  name: string;
  location?: string;
  apiKey: string;
}

export interface UpdateDevicePayload {
  deviceId?: string;
  name?: string;
  location?: string;
  apiKey?: string;
  status?: DeviceStatus;
}

export interface Membership {
  id: number;
  memberId: number;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  createdAt: string;
  member?: Member;
}

export interface CreateMembershipPayload {
  memberId: number;
  startDate: string;
  endDate: string;
}

export interface UpdateMembershipPayload {
  startDate?: string;
  endDate?: string;
  status?: MembershipStatus;
}

export interface Fingerprint {
  id: number;
  memberId: number;
  fingerprintId: number;
  fingerName: string;
  active: boolean;
  createdAt?: string;
  member?: Member;
}

export interface CreateFingerprintPayload {
  memberId: number;
  fingerprintId: number;
  fingerName: string;
}

export interface AttendanceLog {
  id: string;
  memberId?: number | null;
  deviceId: string;
  fingerprintId?: number | null;
  accessGranted: boolean;
  message: string;
  photoUrl?: string | null;
  createdAt: string;
  member?: Member | null;
  device?: Omit<Device, 'apiKey' | 'createdAt' | 'updatedAt'> | null;
}

export interface AttendanceQuery {
  memberId?: number;
  deviceId?: string;
  accessGranted?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface CheckinPayload {
  fingerprintId: number;
  deviceId: string;
}

export interface CheckoutPayload {
  deviceId: string;
  type: string;
}

export interface AccessResponse {
  accessGranted: boolean;
  message: string;
  memberId?: number;
  fingerprintId?: number;
}
