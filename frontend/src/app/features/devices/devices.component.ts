import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateDevicePayload,
  Device,
  DeviceStatus,
  UpdateDevicePayload,
} from '../../core/models/api.models';
import { DevicesService } from '../../core/services/devices.service';

@Component({
  selector: 'app-devices',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Dispositivos</h1>
          <p class="page-subtitle">Terminales ESP32 registradas en el sistema de acceso.</p>
        </div>
      </header>

      <form class="panel" [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingDevice ? 'Editar dispositivo' : 'Nuevo dispositivo' }}</h2>
        <div *ngIf="error" class="message error">{{ error }}</div>
        <div *ngIf="success" class="message success">{{ success }}</div>

        <div class="form-grid">
          <label class="form-field">
            <span>ID del dispositivo</span>
            <input type="text" formControlName="deviceId" placeholder="Ej: ESP32-ENTRADA-01" />
          </label>

          <label class="form-field">
            <span>Nombre</span>
            <input type="text" formControlName="name" placeholder="Entrada principal" />
          </label>

          <label class="form-field">
            <span>Ubicación</span>
            <input type="text" formControlName="location" placeholder="Recepción, Puerta 1..." />
          </label>

          <label class="form-field">
            <span>API Key</span>
            <input type="text" formControlName="apiKey" placeholder="Clave de autenticación" />
          </label>

          <label class="form-field" *ngIf="editingDevice">
            <span>Estado</span>
            <select formControlName="status">
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="MAINTENANCE">Mantenimiento</option>
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid || saving">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn secondary" type="button" (click)="resetForm()">Limpiar</button>
        </div>
      </form>

      <div class="table-panel">
        <table class="data-table" *ngIf="devices.length; else emptyDevices">
          <thead>
            <tr>
              <th>ID dispositivo</th>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let device of devices">
              <td>{{ device.deviceId }}</td>
              <td>{{ device.name }}</td>
              <td>{{ device.location || '—' }}</td>
              <td>
                <span class="status" [ngClass]="device.status">
                  {{ formatDeviceStatus(device.status) }}
                </span>
              </td>
              <td>{{ device.createdAt | date: 'mediumDate' }}</td>
              <td>
                <div class="toolbar">
                  <button class="btn secondary" type="button" (click)="edit(device)">Editar</button>
                  <button class="btn danger" type="button" (click)="remove(device)">
                    Inactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyDevices>
          <div class="empty-state">
            {{ loading ? 'Cargando dispositivos...' : 'No hay dispositivos registrados.' }}
          </div>
        </ng-template>
      </div>
    </section>
  `,
})
export class DevicesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly devicesService = inject(DevicesService);

  readonly form = this.fb.nonNullable.group({
    deviceId: ['', Validators.required],
    name: ['', Validators.required],
    location: [''],
    apiKey: ['', Validators.required],
    status: ['ACTIVE' as DeviceStatus, Validators.required],
  });

  devices: Device[] = [];
  editingDevice?: Device;
  loading = true;
  saving = false;
  success = '';
  error = '';

  ngOnInit(): void {
    this.loadDevices();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.success = '';
    this.error = '';

    const request = this.editingDevice
      ? this.devicesService.update(this.editingDevice.id, this.getUpdatePayload())
      : this.devicesService.create(this.getCreatePayload());

    request.subscribe({
      next: () => {
        this.success = this.editingDevice ? 'Dispositivo actualizado.' : 'Dispositivo creado.';
        this.saving = false;
        this.resetForm();
        this.loadDevices();
      },
      error: () => {
        this.error = 'No se pudo guardar el dispositivo.';
        this.saving = false;
      },
    });
  }

  edit(device: Device): void {
    this.editingDevice = device;
    this.form.patchValue({
      deviceId: device.deviceId,
      name: device.name,
      location: device.location ?? '',
      apiKey: device.apiKey ?? '',
      status: device.status,
    });
  }

  remove(device: Device): void {
    const confirmed = confirm(`¿Inactivar el dispositivo ${device.deviceId}?`);

    if (!confirmed) {
      return;
    }

    this.devicesService.remove(device.id).subscribe({
      next: () => this.loadDevices(),
      error: () => {
        this.error = 'No se pudo inactivar el dispositivo.';
      },
    });
  }

  resetForm(): void {
    this.editingDevice = undefined;
    this.form.reset({
      deviceId: '',
      name: '',
      location: '',
      apiKey: '',
      status: 'ACTIVE',
    });
  }

  formatDeviceStatus(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
      MAINTENANCE: 'Mantenimiento',
    };
    return map[status] || status;
  }

  private loadDevices(): void {
    this.loading = true;

    this.devicesService.list().subscribe({
      next: (devices) => {
        this.devices = devices;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los dispositivos.';
        this.loading = false;
      },
    });
  }

  private getCreatePayload(): CreateDevicePayload {
    const value = this.form.getRawValue();
    const payload: CreateDevicePayload = {
      deviceId: value.deviceId.trim(),
      name: value.name.trim(),
      apiKey: value.apiKey.trim(),
    };

    if (value.location.trim()) {
      payload.location = value.location.trim();
    }

    return payload;
  }

  private getUpdatePayload(): UpdateDevicePayload {
    const value = this.form.getRawValue();
    const payload: UpdateDevicePayload = {
      deviceId: value.deviceId.trim(),
      name: value.name.trim(),
      apiKey: value.apiKey.trim(),
      status: value.status,
    };

    if (value.location.trim()) {
      payload.location = value.location.trim();
    }

    return payload;
  }
}
