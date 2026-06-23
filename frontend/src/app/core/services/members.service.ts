import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateMemberPayload, Member, UpdateMemberPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/members`;

  list(): Observable<Member[]> {
    return this.http.get<Member[]>(this.baseUrl);
  }

  get(id: number): Observable<Member> {
    return this.http.get<Member>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateMemberPayload): Observable<Member> {
    return this.http.post<Member>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateMemberPayload): Observable<Member> {
    return this.http.patch<Member>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: number): Observable<Member> {
    return this.http.delete<Member>(`${this.baseUrl}/${id}`);
  }
}
