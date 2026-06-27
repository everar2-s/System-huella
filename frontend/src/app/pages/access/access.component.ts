import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AccessResponse } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './access.component.html',
  styleUrl: './access.component.css',
})
export class AccessComponent {
  private readonly apiService = inject(ApiService);

  loading = false;
  error = '';
  result: AccessResponse | null = null;

  form = {
    fingerprintId: 1,
    deviceId: 'ESP32-ENTRADA-01',
    apiKey: 'gym_esp32_1234',
  };

  checkIn() {
    this.send('entrada');
  }

  checkOut() {
    this.send('salida');
  }

  private send(type: 'entrada' | 'salida') {
    this.loading = true;
    this.error = '';
    this.result = null;

    const request = type === 'entrada'
      ? this.apiService.checkIn({
          fingerprintId: Number(this.form.fingerprintId),
          deviceId: this.form.deviceId,
          apiKey: this.form.apiKey,
        })
      : this.apiService.checkOut({
          fingerprintId: Number(this.form.fingerprintId),
          deviceId: this.form.deviceId,
          apiKey: this.form.apiKey,
        });

    request.subscribe({
      next: (response) => {
        this.result = response;
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }
}
