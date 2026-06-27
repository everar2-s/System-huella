import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  private readonly tokenKey = 'gym_access_token';
  private readonly userKey = 'gym_access_user';

  readonly user = signal<User | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => !!this.getToken());

  login(data: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, data).pipe(
      tap((response) => this.saveSession(response)),
    );
  }

  register(data: { fullName: string; email: string; password: string }) {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  private saveSession(response: AuthResponse) {
    localStorage.setItem(this.tokenKey, response.accessToken);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.user.set(response.user);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.userKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
