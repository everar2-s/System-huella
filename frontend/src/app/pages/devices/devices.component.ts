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
  error = '';
  success = '';

  form = {
    deviceId: 'ESP32-ENTRADA-01',
    name: 'Lector de entrada principal',
    location: 'Recepción',
    apiKey: 'gym_esp32_1234',
  };

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.loading = true;
    this.error = '';

    this.apiService.getDevices().subscribe({
      next: (devices) => {
        this.devices = devices;
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  createDevice() {
    this.saving = true;
    this.error = '';
    this.success = '';

    this.apiService.createDevice(this.form).subscribe({
      next: () => {
        this.success = 'Dispositivo registrado correctamente.';
        this.saving = false;
        this.loadDevices();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  deactivateDevice(id: number) {
    if (!confirm('¿Deseas desactivar este dispositivo?')) return;

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
}
