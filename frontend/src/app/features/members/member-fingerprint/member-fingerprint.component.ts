import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { FingerprintsService } from '../../../core/services/fingerprints.service';
import { MembersService } from '../../../core/services/members.service';

import { Member } from '../../../core/models/api.models';

@Component({
  selector: 'app-member-fingerprint',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a class="back-link" [routerLink]="['/members', memberId]">Detalle del socio</a>

      <header class="page-header">
        <div>
          <h1 class="page-title">Registrar huella</h1>
          <p class="page-subtitle">
            Vincula el ID de la huella almacenada en el sensor AS608 con este socio.
          </p>
        </div>
      </header>

      <div *ngIf="member" class="panel">
        <div style="display:flex; align-items:center; gap:14px">
          <div class="member-badge">{{ getInitials(member.fullName) }}</div>
          <div>
            <strong>{{ member.fullName }}</strong>
            <div>
              <span class="status" [ngClass]="member.status" style="margin-top:6px">
                {{ formatStatus(member.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form class="panel" [formGroup]="form" (ngSubmit)="save()">
        <h2>Datos de la huella</h2>
        <div *ngIf="success" class="message success">{{ success }}</div>
        <div *ngIf="error" class="message error">{{ error }}</div>

        <div class="form-grid">
          <label class="form-field">
            <span>Nombre del Dedo</span>
            <input type="text" formControlName="fingerName" placeholder="Ej: Índice derecho" />
          </label>

          <label class="form-field">
            <span>ID de huella (en sensor)</span>
            <input type="number" min="1" formControlName="fingerprintId" placeholder="Ej: 1, 2, 3..." />
          </label>
        </div>

        <div class="form-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid || saving">
            {{ saving ? 'Registrando...' : 'Registrar huella' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .member-badge {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: linear-gradient(135deg, #6d5cff, #9b8aff);
        color: #fff;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.02em;
        box-shadow: 0 6px 18px rgba(109, 92, 255, 0.2);
      }
    `,
  ],
})
export class MemberFingerprintComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly membersService = inject(MembersService);
  private readonly fingerprintsService = inject(FingerprintsService);

  readonly form = this.fb.nonNullable.group({
    fingerName: ['', Validators.required],
    fingerprintId: [0, [Validators.required, Validators.min(1)]],
  });

  memberId = 0;
  member?: Member;
  saving = false;
  success = '';
  error = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.memberId = idParam ? Number(idParam) : 0;

    if (!this.memberId) {
      this.error = 'ID inválido';
      return;
    }

    this.membersService.get(this.memberId).subscribe({
      next: (member) => {
        this.member = member;
      },
      error: () => {
        this.error = 'No se pudo cargar el socio.';
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving = true;
    this.success = '';
    this.error = '';

    this.fingerprintsService
      .create({
        memberId: this.memberId,
        fingerName: value.fingerName.trim(),
        fingerprintId: Number(value.fingerprintId),
      })
      .subscribe({
        next: () => {
          this.success = 'Huella vinculada correctamente.';
          this.saving = false;
        },
        error: () => {
          this.error = 'No se pudo registrar la huella.';
          this.saving = false;
        },
      });
  }

  getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activo',
      EXPIRED: 'Vencido',
      PENDING_FINGERPRINT: 'Pendiente huella',
      SUSPENDED: 'Suspendido',
      INACTIVE: 'Inactivo',
    };
    return map[status] || status;
  }
}
