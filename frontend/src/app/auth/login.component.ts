import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { getErrorMessage } from '../core/error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mode: 'login' | 'register' = 'login';
  loading = false;
  error = '';
  success = '';

  showLoginPassword = false;
  showRegisterPassword = false;

  loginForm = {
    email: 'admin@gym.com',
    password: '123456',
  };

  registerForm = {
    fullName: 'Administrador',
    email: 'admin@gym.com',
    password: '123456',
  };

  setMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.error = '';
    this.success = '';
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
  }

  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  login() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.login(this.loginForm).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
      },
    });
  }

  register() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.registerForm).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Administrador registrado. Ahora inicia sesión.';
        this.mode = 'login';
        this.showRegisterPassword = false;
        this.showLoginPassword = false;
        this.loginForm.email = this.registerForm.email;
        this.loginForm.password = this.registerForm.password;
      },
      error: (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
      },
    });
  }
}