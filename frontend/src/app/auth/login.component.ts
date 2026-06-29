import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { getErrorMessage } from '../core/error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  mode: 'login' | 'register' = 'login';
  loading = false;
  error = '';
  success = '';

  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;

  loginForm = {
    email: '',
    password: '',
  };

  registerForm = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const verified = params.get('verified');

      if (verified === 'true') {
        this.success =
          'Correo verificado correctamente. Ya puedes iniciar sesión.';
        this.mode = 'login';
      }

      if (verified === 'false') {
        this.error = 'El enlace de verificación no es válido o ya expiró.';
        this.mode = 'login';
      }
    });
  }

  setMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.error = '';
    this.success = '';
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
    this.showConfirmPassword = false;
  }

  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  }

  hasMinLength() {
    return this.registerForm.password.length >= 8;
  }

  hasUpperCase() {
    return /[A-Z]/.test(this.registerForm.password);
  }

  hasLowerCase() {
    return /[a-z]/.test(this.registerForm.password);
  }

  hasNumber() {
    return /\d/.test(this.registerForm.password);
  }

  hasSymbol() {
    return /[@$!%*?&.#_-]/.test(this.registerForm.password);
  }

  isStrongPassword(password: string) {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    return strongPasswordRegex.test(password);
  }

  passwordsMatch() {
    return (
      this.registerForm.password.length > 0 &&
      this.registerForm.confirmPassword.length > 0 &&
      this.registerForm.password === this.registerForm.confirmPassword
    );
  }

  passwordStrength(): 'empty' | 'weak' | 'medium' | 'strong' {
    const password = this.registerForm.password;

    if (!password) {
      return 'empty';
    }

    let score = 0;

    if (this.hasMinLength()) score++;
    if (this.hasUpperCase()) score++;
    if (this.hasLowerCase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSymbol()) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';

    return 'strong';
  }

  passwordStrengthText() {
    const strength = this.passwordStrength();

    if (strength === 'empty') return 'Sin evaluar';
    if (strength === 'weak') return 'Débil';
    if (strength === 'medium') return 'Media';

    return 'Fuerte';
  }

  canLogin() {
    return (
      this.isValidEmail(this.loginForm.email) &&
      this.loginForm.password.trim().length > 0
    );
  }

  canRegister() {
    return (
      this.registerForm.fullName.trim().length > 0 &&
      this.isValidEmail(this.registerForm.email) &&
      this.isStrongPassword(this.registerForm.password) &&
      this.passwordsMatch()
    );
  }

  login() {
    this.error = '';
    this.success = '';

    if (!this.isValidEmail(this.loginForm.email)) {
      this.error = 'Ingresa un correo electrónico válido';
      return;
    }

    if (!this.loginForm.password.trim()) {
      this.error = 'La contraseña es obligatoria';
      return;
    }

    this.loading = true;

    const data = {
      email: this.loginForm.email.trim().toLowerCase(),
      password: this.loginForm.password,
    };

    this.authService.login(data).subscribe({
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
    this.error = '';
    this.success = '';

    if (!this.registerForm.fullName.trim()) {
      this.error = 'El nombre completo es obligatorio';
      return;
    }

    if (!this.isValidEmail(this.registerForm.email)) {
      this.error = 'Ingresa un correo electrónico válido';
      return;
    }

    if (!this.isStrongPassword(this.registerForm.password)) {
      this.error =
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo';
      return;
    }

    if (!this.passwordsMatch()) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;

    const data = {
      fullName: this.registerForm.fullName.trim(),
      email: this.registerForm.email.trim().toLowerCase(),
      password: this.registerForm.password,
    };

    this.authService.register(data).subscribe({
      next: () => {
        this.loading = false;
        this.success =
          'Administrador registrado. Revisa tu correo para verificar la cuenta antes de iniciar sesión.';

        this.mode = 'login';

        this.loginForm.email = data.email;
        this.loginForm.password = '';

        this.registerForm = {
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        };

        this.showRegisterPassword = false;
        this.showConfirmPassword = false;
        this.showLoginPassword = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = getErrorMessage(error);
      },
    });
  }
}