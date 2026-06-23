import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Member, Membership } from '../../../core/models/api.models';
import { MembersService } from '../../../core/services/members.service';
import { MembershipsService } from '../../../core/services/memberships.service';

@Component({
  selector: 'app-member-memberships',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a class="back-link" [routerLink]="['/members', memberId]">Detalle del socio</a>

      <header class="page-header">
        <div>
          <h1 class="page-title">Membresías</h1>
          <p class="page-subtitle">Vigencias asociadas al socio.</p>
        </div>
      </header>

      <div *ngIf="member" class="panel">
        <div style="display:flex; align-items:center; gap:14px">
          <div class="member-badge">{{ getInitials(member.fullName) }}</div>
          <div>
            <strong>{{ member.fullName }}</strong>
            <span class="muted" style="margin-left:8px">{{ member.phone }}</span>
          </div>
        </div>
      </div>

      <form class="panel" [formGroup]="form" (ngSubmit)="createMembership()">
        <h2>Nueva membresía</h2>
        <div *ngIf="error" class="message error">{{ error }}</div>
        <div *ngIf="success" class="message success">{{ success }}</div>

        <!-- Quick presets -->
        <div class="preset-row">
          <span class="section-label">Duración rápida</span>
          <div class="preset-buttons">
            <button type="button" class="btn secondary preset-btn" (click)="setPreset(1)">1 Mes</button>
            <button type="button" class="btn secondary preset-btn" (click)="setPreset(3)">3 Meses</button>
            <button type="button" class="btn secondary preset-btn" (click)="setPreset(6)">6 Meses</button>
            <button type="button" class="btn secondary preset-btn" (click)="setPreset(12)">1 Año</button>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>Fecha de inicio</span>
            <input type="datetime-local" formControlName="startDate" />
          </label>

          <label class="form-field">
            <span>Fecha de fin</span>
            <input type="datetime-local" formControlName="endDate" />
          </label>
        </div>

        <div *ngIf="member?.status === 'PENDING_FINGERPRINT'" class="message">
          ⚠ Este socio aún no tiene huella registrada. Recuerda
          <a [routerLink]="['/members', memberId, 'fingerprint']" style="text-decoration:underline">registrar su huella</a>
          para que pueda acceder al gimnasio.
        </div>

        <div class="form-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid || saving">
            {{ saving ? 'Guardando...' : 'Crear membresía' }}
          </button>
        </div>
      </form>

      <div class="table-panel">
        <table class="data-table" *ngIf="memberships.length; else emptyMemberships">
          <thead>
            <tr>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Creada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let membership of memberships">
              <td>{{ membership.startDate | date: 'mediumDate' }}</td>
              <td>{{ membership.endDate | date: 'mediumDate' }}</td>
              <td>
                <span class="status" [ngClass]="membership.status">
                  {{ formatMembershipStatus(membership.status) }}
                </span>
              </td>
              <td>{{ membership.createdAt | date: 'short' }}</td>
              <td>
                <button
                  class="btn danger"
                  type="button"
                  (click)="cancelMembership(membership)"
                  [disabled]="membership.status === 'CANCELLED'"
                >
                  Cancelar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyMemberships>
          <div class="empty-state">
            {{ loading ? 'Cargando membresías...' : 'No hay membresías registradas.' }}
          </div>
        </ng-template>
      </div>
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

      .preset-row {
        display: grid;
        gap: 10px;
      }

      .preset-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .preset-btn {
        min-height: 36px !important;
        padding: 7px 16px !important;
        font-size: 13px !important;
      }
    `,
  ],
})
export class MemberMembershipsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly membersService = inject(MembersService);
  private readonly membershipsService = inject(MembershipsService);

  readonly form = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  memberId = 0;
  member?: Member;
  memberships: Membership[] = [];
  loading = true;
  saving = false;
  success = '';
  error = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.memberId = idParam ? Number(idParam) : 0;
    this.setDefaultDates();
    this.loadMember();
    this.loadMemberships();
  }

  setPreset(months: number): void {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    end.setHours(23, 59, 0, 0);

    this.form.patchValue({
      startDate: this.toDatetimeLocal(start),
      endDate: this.toDatetimeLocal(end),
    });
  }

  createMembership(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving = true;
    this.error = '';
    this.success = '';

    this.membershipsService
      .create({
        memberId: this.memberId,
        startDate: new Date(value.startDate).toISOString(),
        endDate: new Date(value.endDate).toISOString(),
      })
      .subscribe({
        next: () => {
          this.success = 'Membresía creada correctamente.';
          this.saving = false;
          this.loadMemberships();
        },
        error: () => {
          this.error = 'No se pudo crear la membresía.';
          this.saving = false;
        },
      });
  }

  cancelMembership(membership: Membership): void {
    const confirmed = confirm('¿Cancelar esta membresía?');
    if (!confirmed) return;

    this.membershipsService.remove(membership.id).subscribe({
      next: () => this.loadMemberships(),
      error: () => {
        this.error = 'No se pudo cancelar la membresía.';
      },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  }

  formatMembershipStatus(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activa',
      EXPIRED: 'Vencida',
      CANCELLED: 'Cancelada',
    };
    return map[status] || status;
  }

  private loadMember(): void {
    this.membersService.get(this.memberId).subscribe({
      next: (member) => {
        this.member = member;
      },
      error: () => {
        this.error = 'No se pudo cargar el socio.';
      },
    });
  }

  private loadMemberships(): void {
    this.loading = true;

    this.membershipsService.byMember(this.memberId).subscribe({
      next: (memberships) => {
        this.memberships = memberships;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las membresías.';
        this.loading = false;
      },
    });
  }

  private setDefaultDates(): void {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setHours(23, 59, 0, 0);

    this.form.patchValue({
      startDate: this.toDatetimeLocal(start),
      endDate: this.toDatetimeLocal(end),
    });
  }

  private toDatetimeLocal(date: Date): string {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }
}
