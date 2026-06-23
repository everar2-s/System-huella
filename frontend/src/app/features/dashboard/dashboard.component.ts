import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AttendanceLog, Member, Membership } from '../../core/models/api.models';
import { AttendanceService } from '../../core/services/attendance.service';
import { MembersService } from '../../core/services/members.service';
import { MembershipsService } from '../../core/services/memberships.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <!-- Hero header -->
      <div class="dash-hero">
        <div class="dash-hero-text">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Resumen operativo del acceso al gimnasio.</p>
        </div>
        <div class="toolbar">
          <a class="btn primary" routerLink="/members/new">+ Nuevo socio</a>
        </div>
      </div>

      <div *ngIf="error" class="message error">{{ error }}</div>

      <!-- Stats -->
      <div class="stats-grid">
        <article class="stat-card stat-total">
          <span>Total socios</span>
          <strong>{{ totalMembers }}</strong>
        </article>

        <article class="stat-card stat-active">
          <span>Activos</span>
          <strong>{{ activeMembers }}</strong>
        </article>

        <article class="stat-card stat-expired">
          <span>Vencidos</span>
          <strong>{{ expiredMembers }}</strong>
        </article>

        <article class="stat-card stat-today">
          <span>Entradas hoy</span>
          <strong>{{ todayEntries }}</strong>
        </article>
      </div>

      <!-- Alerts row -->
      <div class="dash-alerts" *ngIf="pendingFingerprint.length > 0">
        <div class="alert-card warning">
          <div class="alert-icon">⚠</div>
          <div class="alert-body">
            <strong>{{ pendingFingerprint.length }} socio{{ pendingFingerprint.length > 1 ? 's' : '' }} sin huella registrada</strong>
            <p>
              <span *ngFor="let m of pendingFingerprint; let last = last">
                <a [routerLink]="['/members', m.id, 'fingerprint']">{{ m.fullName }}</a>{{ last ? '' : ', ' }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Two-column: Recent entries + Expiring memberships -->
      <div class="dash-columns">
        <!-- Recent entries -->
        <div class="panel">
          <div class="panel-header">
            <h2>Últimas entradas</h2>
            <a class="btn secondary" routerLink="/attendance" style="min-height:34px; padding:6px 14px; font-size:12px">Ver todo</a>
          </div>
          <div class="table-panel" style="border:0;box-shadow:none;backdrop-filter:none">
            <table class="data-table" *ngIf="recentEntries.length; else noEntries">
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Acceso</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of recentEntries">
                  <td>{{ log.member?.fullName || 'Desconocido' }}</td>
                  <td>
                    <span class="status" [ngClass]="log.accessGranted ? 'ok' : 'denied'">
                      {{ log.accessGranted ? 'Permitido' : 'Rechazado' }}
                    </span>
                  </td>
                  <td>{{ log.createdAt | date: 'short' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noEntries>
              <div class="empty-state">Sin entradas recientes.</div>
            </ng-template>
          </div>
        </div>

        <!-- Expiring memberships -->
        <div class="panel">
          <div class="panel-header">
            <h2>Membresías por vencer</h2>
            <span class="section-label">Próximos 7 días</span>
          </div>

          <div *ngIf="expiringMemberships.length; else noExpiring">
            <div class="expiring-item" *ngFor="let ms of expiringMemberships">
              <div class="expiring-name">
                <a [routerLink]="['/members', ms.memberId, 'memberships']">
                  {{ ms.member?.fullName || 'Socio' }}
                </a>
              </div>
              <div class="expiring-date">
                Vence {{ ms.endDate | date: 'mediumDate' }}
              </div>
            </div>
          </div>

          <ng-template #noExpiring>
            <div class="empty-state">Ninguna membresía vence próximamente.</div>
          </ng-template>
        </div>
      </div>

      <div *ngIf="loading" class="panel muted" style="text-align:center">Cargando datos...</div>
    </section>
  `,
  styles: [
    `
      .dash-hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
      }

      .dash-alerts {
        display: grid;
        gap: 12px;
      }

      .alert-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px 20px;
        border-radius: 14px;
        border: 1px solid rgba(161, 92, 0, 0.12);
        background: linear-gradient(135deg, rgba(255, 246, 223, 0.9), rgba(255, 250, 238, 0.8));
        backdrop-filter: blur(8px);
        animation: slideIn 300ms ease both;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .alert-icon {
        font-size: 20px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .alert-body strong {
        display: block;
        font-size: 14px;
        color: var(--warning);
        margin-bottom: 4px;
      }

      .alert-body p {
        margin: 0;
        font-size: 13px;
        color: var(--ink-soft);
        line-height: 1.5;
      }

      .alert-body a {
        color: var(--warning);
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .dash-columns {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 16px;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .expiring-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--line);
      }

      .expiring-item:last-child {
        border-bottom: 0;
      }

      .expiring-name a {
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        color: var(--ink);
      }

      .expiring-name a:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .expiring-date {
        font-size: 13px;
        color: var(--danger);
        font-weight: 600;
      }

      @media (max-width: 900px) {
        .dash-columns {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly membersService = inject(MembersService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly membershipsService = inject(MembershipsService);

  totalMembers = 0;
  activeMembers = 0;
  expiredMembers = 0;
  todayEntries = 0;
  loading = true;
  error = '';

  pendingFingerprint: Member[] = [];
  recentEntries: AttendanceLog[] = [];
  expiringMemberships: Membership[] = [];

  ngOnInit(): void {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    forkJoin({
      members: this.membersService.list(),
      todayAttendance: this.attendanceService.list({
        accessGranted: true,
        fromDate: todayStart.toISOString(),
        toDate: todayEnd.toISOString(),
      }),
      recentAll: this.attendanceService.list({}),
      memberships: this.membershipsService.list(),
    }).subscribe({
      next: ({ members, todayAttendance, recentAll, memberships }) => {
        // Stats
        this.totalMembers = members.length;
        this.activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
        this.expiredMembers = members.filter((m) => m.status === 'EXPIRED').length;
        this.todayEntries = todayAttendance.length;

        // Pending fingerprints
        this.pendingFingerprint = members.filter((m) => m.status === 'PENDING_FINGERPRINT');

        // Recent entries (last 8)
        this.recentEntries = recentAll.slice(0, 8);

        // Expiring memberships (next 7 days)
        const in7Days = new Date(now);
        in7Days.setDate(in7Days.getDate() + 7);
        this.expiringMemberships = memberships
          .filter(
            (ms) =>
              ms.status === 'ACTIVE' &&
              new Date(ms.endDate) >= now &&
              new Date(ms.endDate) <= in7Days,
          )
          .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
          .slice(0, 6);

        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el resumen.';
        this.loading = false;
      },
    });
  }
}
