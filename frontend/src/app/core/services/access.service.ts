import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccessResponse, CheckinPayload, CheckoutPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/access`;

  checkin(payload: CheckinPayload): Observable<AccessResponse> {
    return this.http.post<AccessResponse>(`${this.baseUrl}/checkin`, payload);
  }

  checkout(payload: CheckoutPayload): Observable<AccessResponse> {
    return this.http.post<AccessResponse>(`${this.baseUrl}/checkout`, payload);
  }
}
