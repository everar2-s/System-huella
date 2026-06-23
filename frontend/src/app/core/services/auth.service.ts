import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AuthResponse, LoginPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'sistema_huella_access_token';
  private readonly adminKey = 'sistema_huella_admin';
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly admin = signal<AdminUser | null>(this.loadAdmin());

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.accessToken);
        localStorage.setItem(this.adminKey, JSON.stringify(response.admin));
        this.admin.set(response.admin);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
    this.admin.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  private loadAdmin(): AdminUser | null {
    const adminJson = localStorage.getItem(this.adminKey);

    if (!adminJson) {
      return null;
    }

    try {
      return JSON.parse(adminJson) as AdminUser;
    } catch {
      localStorage.removeItem(this.adminKey);
      return null;
    }
  }
}
