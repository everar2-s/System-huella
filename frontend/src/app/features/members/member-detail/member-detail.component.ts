import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AttendanceLog, Fingerprint, Member, Membership } from '../../../core/models/api.models';
import { AttendanceService } from '../../../core/services/attendance.service';
import { FingerprintsService } from '../../../core/services/fingerprints.service';
import { MembersService } from '../../../core/services/members.service';
import { MembershipsService } from '../../../core/services/memberships.service';

@Component({
  selector: 'app-member-detail',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/members">Socios</a>

      <header class="page-header">
        <div>
          <h1 class="page-title">Detalle del socio</h1>
          <p class="page-subtitle">Información general, membresías, huellas y últimos accesos.</p>
        </div>
      </header>

      <div *ngIf="error" class="message error">{{ error }}</div>

      <!-- Member info card -->
      <article class="panel member-card" *ngIf="member">
        <div class="member-info-grid">
          <div class="member-avatar">{{ getInitials(member.fullName) }}</div>
          <div class="member-data">
            <h2>{{ member.fullName }}</h2>
            <div class="member-meta">
              <span>📱 {{ member.phone }}</span>
              <span *ngIf="member.email">📧 {{ member.email }}</span>
              <span>📅 Registrado {{ member.createdAt | date: 'mediumDate' }}</span>
            </div>
            <div style="margin-top:8px">
              <span class="status" [ngClass]="member.status">{{ formatStatus(member.status) }}</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <a class="btn primary" [routerLink]="['/members', member.id, 'edit']">Editar</a>
          <a class="btn secondary" [routerLink]="['/members', member.id, 'fingerprint']">Registrar huella</a>
          <a class="btn secondary" [routerLink]="['/members', member.id, 'memberships']">Membresías</a>
        </div>
      </article>

      <!-- Two columns: Fingerprints + Active membership -->
      <div class="detail-columns" *ngIf="member">
        <div class="panel">
          <h2>Huellas registradas</h2>
          <div *ngIf="fingerprints.length; else noFingerprints">
            <div class="fingerprint-item" *ngFor="let fp of fingerprints">
              <span class="fp-id">ID #{{ fp.fingerprintId }}</span>
              <span class="fp-device">{{ fp.fingerName }}</span>
              <span class="fp-date" [ngClass]="fp.active ? 'status ok' : 'status denied'">
                {{ fp.active ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
          </div>
          <ng-template #noFingerprints>
            <div class="empty-state">Sin huellas registradas.</div>
          </ng-template>
        </div>

        <div class="panel">
          <h2>Membresía activa</h2>
          <div *ngIf="activeMembership; else noMembership">
            <div class="membership-active">
              <div>
                <span class="status ACTIVE">ACTIVA</span>
              </div>
              <p><strong>Inicio:</strong> {{ activeMembership.startDate | date: 'mediumDate' }}</p>
              <p><strong>Fin:</strong> {{ activeMembership.endDate | date: 'mediumDate' }}</p>
              <p class="muted" style="font-size:13px; margin-top:6px">
                {{ daysRemaining(activeMembership.endDate) }} días restantes
              </p>
            </div>
          </div>
          <ng-template #noMembership>
            <div class="empty-state">Sin membresía activa.</div>
          </ng-template>
        </div>
      </div>

      <!-- Recent accesses -->
      <div class="panel" *ngIf="member">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <h2>Últimos accesos</h2>
        </div>
        <div class="table-panel" style="border:0;box-shadow:none;backdrop-filter:none">
          <table class="data-table" *ngIf="recentAccesses.length; else noAccesses">
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Acceso</th>
                <th>Mensaje</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of recentAccesses">
                <td>{{ log.deviceId }}</td>
                <td>
                  <span class="status" [ngClass]="log.accessGranted ? 'ok' : 'denied'">
                    {{ log.accessGranted ? 'Permitido' : 'Rechazado' }}
                  </span>
                </td>
                <td>{{ log.message }}</td>
                <td>{{ log.createdAt | date: 'medium' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noAccesses>
            <div class="empty-state">Sin accesos registrados.</div>
          </ng-template>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .member-card {
        overflow: hidden;
      }

      .member-info-grid {
        display: flex;
        gap: 20px;
        align-items: center;
      }

      .member-avatar {
        width: 64px;
        height: 64px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: linear-gradient(135deg, #6d5cff, #9b8aff);
        color: #fff;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
        box-shadow: 0 8px 24px rgba(109, 92, 255, 0.2);
      }

      .member-data h2 {
        margin: 0 0 6px;
        font-size: 22px;
      }

      .member-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 13px;
        color: var(--muted);
      }

      .detail-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .fingerprint-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
        font-size: 14px;
      }

      .fingerprint-item:last-child {
        border-bottom: 0;
      }

      .fp-id {
        font-weight: 700;
        color: var(--ink);
        min-width: 60px;
      }

      .fp-device {
        color: var(--ink-soft);
      }

      .fp-date {
        margin-left: auto;
        font-size: 12px;
      }

      .membership-active {
        display: grid;
        gap: 8px;
      }

      .membership-active p {
        margin: 0;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .detail-columns {
          grid-template-columns: 1fr;
        }

        .member-info-grid {
          flex-direction: column;
          text-align: center;
        }

        .member-meta {
          justify-content: center;
        }
      }
    `,
  ],
})
export class MemberDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly membersService = inject(MembersService);
  private readonly fingerprintsService = inject(FingerprintsService);
  private readonly membershipsService = inject(MembershipsService);
  private readonly attendanceService = inject(AttendanceService);

  member?: Member;
  fingerprints: Fingerprint[] = [];
  activeMembership?: Membership;
  recentAccesses: AttendanceLog[] = [];
  error = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : 0;

    forkJoin({
      member: this.membersService.get(id),
      fingerprints: this.fingerprintsService.list(),
      memberships: this.membershipsService.byMember(id),
      accesses: this.attendanceService.byMember(id),
    }).subscribe({
      next: ({ member, fingerprints, memberships, accesses }) => {
        this.member = member;
        this.fingerprints = fingerprints.filter((fp) => fp.memberId === id);
        this.activeMembership = memberships.find((ms) => ms.status === 'ACTIVE' && new Date(ms.endDate) >= new Date());
        this.recentAccesses = accesses.slice(0, 10);
      },
      error: () => {
        this.error = 'No se pudo cargar el socio.';
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
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

  daysRemaining(endDate: string): number {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
