import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateFingerprintPayload, Fingerprint } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class FingerprintsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fingerprints`;

  list(): Observable<Fingerprint[]> {
    return this.http.get<Fingerprint[]>(this.baseUrl);
  }

  get(id: number): Observable<Fingerprint> {
    return this.http.get<Fingerprint>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateFingerprintPayload): Observable<Fingerprint> {
    return this.http.post<Fingerprint>(this.baseUrl, payload);
  }

  remove(id: number): Observable<Fingerprint> {
    return this.http.delete<Fingerprint>(`${this.baseUrl}/${id}`);
  }
}
