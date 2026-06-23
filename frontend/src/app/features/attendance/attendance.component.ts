import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AttendanceLog, AttendanceQuery } from '../../core/models/api.models';
import { AttendanceService } from '../../core/services/attendance.service';

@Component({
  selector: 'app-attendance',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Asistencias</h1>
          <p class="page-subtitle">Historial de accesos permitidos y rechazados al gimnasio.</p>
        </div>
      </header>

      <form class="panel" [formGroup]="filters" (ngSubmit)="loadAttendance()">
        <h2>Filtros de búsqueda</h2>
        <div class="form-grid">
          <label class="form-field">
            <span>ID del socio</span>
            <input type="text" formControlName="memberId" placeholder="UUID del socio" />
          </label>

          <label class="form-field">
            <span>ID del dispositivo</span>
            <input type="text" formControlName="deviceId" placeholder="Ej: ESP32-ENTRADA-01" />
          </label>

          <label class="form-field">
            <span>Resultado</span>
            <select formControlName="accessGranted">
              <option value="">Todos</option>
              <option value="true">Permitidos</option>
              <option value="false">Rechazados</option>
            </select>
          </label>

          <label class="form-field">
            <span>Desde</span>
            <input type="datetime-local" formControlName="fromDate" />
          </label>

          <label class="form-field">
            <span>Hasta</span>
            <input type="datetime-local" formControlName="toDate" />
          </label>
        </div>

        <div class="form-actions">
          <button class="btn primary" type="submit">Filtrar</button>
          <button class="btn secondary" type="button" (click)="clearFilters()">Limpiar</button>
        </div>
      </form>

      <div *ngIf="error" class="message error">{{ error }}</div>

      <div class="table-panel">
        <table class="data-table" *ngIf="attendance.length; else emptyAttendance">
          <thead>
            <tr>
              <th>Socio</th>
              <th>Dispositivo</th>
              <th>Huella ID</th>
              <th>Acceso</th>
              <th>Mensaje</th>
              <th>Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of attendance">
              <td>{{ log.member?.fullName || 'Desconocido' }}</td>
              <td>{{ log.deviceId }}</td>
              <td>{{ log.fingerprintId ?? '—' }}</td>
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

        <ng-template #emptyAttendance>
          <div class="empty-state">
            {{ loading ? 'Cargando asistencias...' : 'No hay asistencias para mostrar.' }}
          </div>
        </ng-template>
      </div>
    </section>
  `,
})
export class AttendanceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);

  readonly filters = this.fb.nonNullable.group({
    memberId: [''],
    deviceId: [''],
    accessGranted: [''],
    fromDate: [''],
    toDate: [''],
  });

  attendance: AttendanceLog[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.list(this.buildQuery()).subscribe({
      next: (attendance) => {
        this.attendance = attendance;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el historial de asistencias.';
        this.loading = false;
      },
    });
  }

  clearFilters(): void {
    this.filters.reset();
    this.loadAttendance();
  }

  private buildQuery(): AttendanceQuery {
    const value = this.filters.getRawValue();
    const query: AttendanceQuery = {};

    if (value.memberId.trim()) {
      query.memberId = Number(value.memberId.trim());
    }

    if (value.deviceId.trim()) {
      query.deviceId = value.deviceId.trim();
    }

    if (value.accessGranted === 'true') {
      query.accessGranted = true;
    }

    if (value.accessGranted === 'false') {
      query.accessGranted = false;
    }

    if (value.fromDate) {
      query.fromDate = new Date(value.fromDate).toISOString();
    }

    if (value.toDate) {
      query.toDate = new Date(value.toDate).toISOString();
    }

    return query;
  }
}
