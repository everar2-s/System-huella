import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AccessResponse,
  AttendanceLog,
  Device,
  Fingerprint,
  Member,
  Membership,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

updateMember(
  id: number,
  data: {
    fullName?: string;
    phone?: string;
    email?: string;
  },
) {
  return this.http.patch(`${this.baseUrl}/members/${id}`, data);
}
  getMembers() {
    return this.http.get<Member[]>(`${this.baseUrl}/members`);
  }

  createMember(data: Partial<Member>) {
    return this.http.post<Member>(`${this.baseUrl}/members`, data);
  }
  suspendMember(id: number) {
  return this.http.patch(`${this.baseUrl}/members/${id}/suspend`, {});
}

reactivateMember(id: number) {
  return this.http.patch(`${this.baseUrl}/members/${id}/reactivate`, {});
}

  getFingerprints() {
    return this.http.get<Fingerprint[]>(`${this.baseUrl}/fingerprints`);
  }

  createFingerprint(data: { memberId: number; fingerprintId: number; fingerName: string }) {
    return this.http.post<Fingerprint>(`${this.baseUrl}/fingerprints`, data);
  }

  deleteFingerprint(id: number) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/fingerprints/${id}`);
  }

  getMemberships() {
    return this.http.get<Membership[]>(`${this.baseUrl}/memberships`);
  }
  renewMembership(data: {
  memberId: number;
  type: string;
  startDate: string;
  endDate: string;
  price: number;
}) {
  return this.http.post(`${this.baseUrl}/memberships/renew`, data);
}

  createMembership(data: {
    memberId: number;
    type: string;
    startDate: string;
    endDate: string;
    price: number;
  }) {
    return this.http.post<Membership>(`${this.baseUrl}/memberships`, data);
  }

  cancelMembership(id: number) {
    return this.http.patch(`${this.baseUrl}/memberships/${id}/cancel`, {});
  }

  getAttendance() {
    return this.http.get<AttendanceLog[]>(`${this.baseUrl}/attendance`);
  }

  getDevices() {
    return this.http.get<Device[]>(`${this.baseUrl}/devices`);
  }

  createDevice(data: { deviceId: string; name: string; location?: string; apiKey: string }) {
    return this.http.post<Device>(`${this.baseUrl}/devices`, data);
  }

  deactivateDevice(id: number) {
    return this.http.patch(`${this.baseUrl}/devices/${id}/deactivate`, {});
  }

  checkIn(data: { fingerprintId: number; deviceId: string; apiKey: string }) {
    const headers = new HttpHeaders({ 'x-api-key': data.apiKey });

    return this.http.post<AccessResponse>(
      `${this.baseUrl}/access/checkin`,
      {
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
      },
      { headers },
    );
  }

  checkOut(data: { fingerprintId: number; deviceId: string; apiKey: string }) {
    const headers = new HttpHeaders({ 'x-api-key': data.apiKey });

    return this.http.post<AccessResponse>(
      `${this.baseUrl}/access/checkout`,
      {
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
      },
      { headers },
    );
  }
}
