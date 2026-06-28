import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { Device } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
})
export class DevicesComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  devices: Device[] = [];

  loading = false;
  saving = false;
  creating = false;

  error = '';
  success = '';

  filterDeviceId = '';
  filterName = '';
  filterLocation = '';
  filterStatus = '';

  form = this.getEmptyForm();

  ngOnInit() {
    this.loadDevices();
  }

  get filteredDevices() {
    const deviceId = this.normalizeText(this.filterDeviceId);
    const name = this.normalizeText(this.filterName);
    const location = this.normalizeText(this.filterLocation);
    const status = this.filterStatus;

    return [...this.devices]
      .sort((a, b) => a.id - b.id)
      .filter((device) => {
        const matchesDeviceId =
          !deviceId ||
          this.normalizeText(device.deviceId).includes(deviceId);

        const matchesName =
          !name || this.normalizeText(device.name).includes(name);

        const matchesLocation =
          !location ||
          this.normalizeText(device.location || '').includes(location);

        const matchesStatus = !status || device.status === status;

        return (
          matchesDeviceId &&
          matchesName &&
          matchesLocation &&
          matchesStatus
        );
      });
  }

  loadDevices() {
    this.loading = true;
    this.error = '';

    this.apiService.getDevices().subscribe({
      next: (devices) => {
        this.devices = devices.sort((a, b) => a.id - b.id);
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  clearFilters() {
    this.filterDeviceId = '';
    this.filterName = '';
    this.filterLocation = '';
    this.filterStatus = '';
  }

  openCreate() {
    this.error = '';
    this.success = '';
    this.form = this.getEmptyForm();
    this.creating = true;
  }

  cancelCreate() {
    this.creating = false;
    this.form = this.getEmptyForm();
  }

  createDevice() {
    this.error = '';
    this.success = '';

    const deviceId = this.form.deviceId.trim();
    const name = this.form.name.trim();
    const location = this.form.location.trim();
    const apiKey = this.form.apiKey.trim();

    if (!deviceId) {
      this.error = 'El deviceId es obligatorio.';
      return;
    }

    if (!name) {
      this.error = 'El nombre del dispositivo es obligatorio.';
      return;
    }

    if (!apiKey) {
      this.error = 'La apiKey es obligatoria.';
      return;
    }

    this.saving = true;

    const data = {
      deviceId,
      name,
      location,
      apiKey,
    };

    this.apiService.createDevice(data).subscribe({
      next: () => {
        this.success = 'Dispositivo registrado correctamente.';
        this.saving = false;
        this.cancelCreate();
        this.loadDevices();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  deactivateDevice(id: number) {
    const confirmDeactivate = confirm(
      '¿Seguro que deseas desactivar este dispositivo?',
    );

    if (!confirmDeactivate) {
      return;
    }

    this.error = '';
    this.success = '';

    this.apiService.deactivateDevice(id).subscribe({
      next: () => {
        this.success = 'Dispositivo desactivado correctamente.';
        this.loadDevices();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
      },
    });
  }

  statusClass(status: string) {
    if (status === 'activo') return 'success';

    if (status === 'inactivo') return 'danger';

    return 'warning';
  }

  private getEmptyForm() {
    return {
      deviceId: '',
      name: '',
      location: '',
      apiKey: '',
    };
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}