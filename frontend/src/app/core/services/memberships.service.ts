import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateMembershipPayload, Membership, UpdateMembershipPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MembershipsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/memberships`;

  list(): Observable<Membership[]> {
    return this.http.get<Membership[]>(this.baseUrl);
  }

  get(id: number): Observable<Membership> {
    return this.http.get<Membership>(`${this.baseUrl}/${id}`);
  }

  byMember(memberId: number): Observable<Membership[]> {
    return this.http.get<Membership[]>(`${this.baseUrl}/member/${memberId}`);
  }

  create(payload: CreateMembershipPayload): Observable<Membership> {
    return this.http.post<Membership>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateMembershipPayload): Observable<Membership> {
    return this.http.patch<Membership>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: number): Observable<Membership> {
    return this.http.delete<Membership>(`${this.baseUrl}/${id}`);
  }
}
