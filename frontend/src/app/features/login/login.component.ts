import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="login-page">
      <div class="login-backdrop"></div>

      <form class="login-panel" [formGroup]="form" (ngSubmit)="login()">
        <div class="login-brand">
          <img src="/fingers-logo.svg" alt="FingerS" />
          <h1>FingerS</h1>
          <p>Control biométrico para gimnasio</p>
        </div>

        <div *ngIf="error" class="message error">{{ error }}</div>

        <label class="form-field">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="admin@gimnasio.com" autocomplete="email" />
        </label>

        <label class="form-field">
          <span>Contraseña</span>
          <input type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
        </label>

        <button class="btn primary login-btn" type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Entrando...' : 'Iniciar sesión' }}
        </button>
      </form>
    </section>
  `,
  styles: [
    `
      .login-page {
        position: relative;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        overflow: hidden;
      }

      .login-backdrop {
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse 70% 50% at 50% 0%, rgba(109, 92, 255, 0.08), transparent),
          radial-gradient(ellipse 50% 40% at 80% 100%, rgba(109, 92, 255, 0.05), transparent),
          linear-gradient(180deg, #f0f0f3 0%, #e8e8ec 100%);
        z-index: -1;
      }

      .login-panel {
        width: min(420px, 100%);
        display: grid;
        gap: 20px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(7, 7, 7, 0.08);
        border-radius: 20px;
        padding: 36px 32px;
        box-shadow:
          0 32px 100px rgba(0, 0, 0, 0.10),
          0 0 0 1px rgba(255, 255, 255, 0.6) inset;
        backdrop-filter: blur(28px) saturate(1.3);
        -webkit-backdrop-filter: blur(28px) saturate(1.3);
        animation: panelIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      @keyframes panelIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .login-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        padding-bottom: 8px;
      }

      .login-brand img {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
        margin-bottom: 4px;
      }

      .login-panel h1 {
        margin: 0;
        font-size: 36px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .login-panel p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.4;
      }

      .login-btn {
        min-height: 48px;
        margin-top: 4px;
        font-size: 15px;
        font-weight: 700;
        border-radius: 14px;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = 'Credenciales inválidas.';
        this.loading = false;
      },
    });
  }
}
