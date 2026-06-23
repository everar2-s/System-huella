import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccessResponse } from '../../core/models/api.models';
import { AccessService } from '../../core/services/access.service';

@Component({
  selector: 'app-access',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Control de Accesos (Simulador)</h1>
          <p class="page-subtitle">Prueba los endpoints de check-in y check-out simulando las peticiones del hardware.</p>
        </div>
      </header>

      <div *ngIf="responseMessage" class="message" [ngClass]="isAccessGranted ? 'success' : 'error'" style="margin-bottom: 20px; font-size: 18px; text-align: center; font-weight: bold;">
        {{ responseMessage }}
      </div>

      <div class="access-grid">
        <!-- Panel de Check-in -->
        <form class="panel access-panel" [formGroup]="checkinForm" (ngSubmit)="onCheckin()">
          <h2 style="color: var(--primary);">Entrada (Check-in)</h2>
          <p class="muted">Simula colocar una huella en el torniquete de entrada.</p>

          <div class="form-grid">
            <label class="form-field">
              <span>ID de Huella (fingerprintId)</span>
              <input type="number" formControlName="fingerprintId" placeholder="Ej: 101" />
            </label>

            <label class="form-field">
              <span>ID del Dispositivo (deviceId)</span>
              <input type="text" formControlName="deviceId" />
            </label>
          </div>

          <div class="form-actions" style="margin-top: 1rem;">
            <button class="btn primary" type="submit" [disabled]="checkinForm.invalid || loadingCheckin">
              {{ loadingCheckin ? 'Enviando...' : 'Simular Entrada' }}
            </button>
          </div>
        </form>

        <!-- Panel de Check-out -->
        <form class="panel access-panel" [formGroup]="checkoutForm" (ngSubmit)="onCheckout()">
          <h2 style="color: #ff5c5c;">Salida (Check-out)</h2>
          <p class="muted">Simula presionar el botón o cruzar el torniquete de salida.</p>

          <div class="form-grid">
            <label class="form-field">
              <span>ID del Dispositivo (deviceId)</span>
              <input type="text" formControlName="deviceId" />
            </label>

            <label class="form-field">
              <span>Tipo de acceso</span>
              <input type="text" formControlName="type" readonly />
            </label>
          </div>

          <div class="form-actions" style="margin-top: 1rem;">
            <button class="btn danger" type="submit" [disabled]="checkoutForm.invalid || loadingCheckout">
              {{ loadingCheckout ? 'Enviando...' : 'Simular Salida' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [
    `
      .access-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }

      .access-panel {
        display: flex;
        flex-direction: column;
      }

      @media (max-width: 768px) {
        .access-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AccessComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accessService = inject(AccessService);

  readonly checkinForm = this.fb.nonNullable.group({
    fingerprintId: [0, [Validators.required, Validators.min(1)]],
    deviceId: ['ESP32-entrada-01', Validators.required],
  });

  readonly checkoutForm = this.fb.nonNullable.group({
    deviceId: ['ESP32-salida-01', Validators.required],
    type: ['salida', Validators.required],
  });

  loadingCheckin = false;
  loadingCheckout = false;
  responseMessage = '';
  isAccessGranted = false;

  onCheckin(): void {
    if (this.checkinForm.invalid) return;

    this.loadingCheckin = true;
    this.responseMessage = '';

    const payload = this.checkinForm.getRawValue();

    this.accessService.checkin(payload).subscribe({
      next: (res: AccessResponse) => {
        this.loadingCheckin = false;
        this.isAccessGranted = res.accessGranted;
        this.responseMessage = res.message || 'Entrada permitida';
      },
      error: (err) => {
        this.loadingCheckin = false;
        this.isAccessGranted = false;
        this.responseMessage = err.error?.message || 'Error de conexión o entrada denegada';
      },
    });
  }

  onCheckout(): void {
    if (this.checkoutForm.invalid) return;

    this.loadingCheckout = true;
    this.responseMessage = '';

    const payload = this.checkoutForm.getRawValue();

    this.accessService.checkout(payload).subscribe({
      next: (res: AccessResponse) => {
        this.loadingCheckout = false;
        this.isAccessGranted = res.accessGranted;
        this.responseMessage = res.message || 'Salida registrada correctamente';
      },
      error: (err) => {
        this.loadingCheckout = false;
        this.isAccessGranted = false;
        this.responseMessage = err.error?.message || 'Error al procesar la salida';
      },
    });
  }
}
