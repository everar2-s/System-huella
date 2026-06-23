import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceLog, AttendanceQuery } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/attendance`;

  list(query: AttendanceQuery = {}): Observable<AttendanceLog[]> {
    let params = new HttpParams();

    if (query.memberId) {
      params = params.set('memberId', query.memberId);
    }

    if (query.deviceId) {
      params = params.set('deviceId', query.deviceId);
    }

    if (query.accessGranted !== undefined) {
      params = params.set('accessGranted', String(query.accessGranted));
    }

    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }

    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    return this.http.get<AttendanceLog[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<AttendanceLog> {
    return this.http.get<AttendanceLog>(`${this.baseUrl}/${id}`);
  }

  byMember(memberId: number): Observable<AttendanceLog[]> {
    return this.http.get<AttendanceLog[]>(`${this.baseUrl}/member/${memberId}`);
  }

  byDevice(deviceId: string): Observable<AttendanceLog[]> {
    return this.http.get<AttendanceLog[]>(`${this.baseUrl}/device/${deviceId}`);
  }
}
