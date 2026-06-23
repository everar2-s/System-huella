import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateDevicePayload, Device, UpdateDevicePayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/devices`;

  list(): Observable<Device[]> {
    return this.http.get<Device[]>(this.baseUrl);
  }

  get(id: string): Observable<Device> {
    return this.http.get<Device>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateDevicePayload): Observable<Device> {
    return this.http.post<Device>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateDevicePayload): Observable<Device> {
    return this.http.patch<Device>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<Device> {
    return this.http.delete<Device>(`${this.baseUrl}/${id}`);
  }
}
