import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AttendanceLog } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  loading = false;
  error = '';
  recentAttendance: AttendanceLog[] = [];

  stats = [
    { label: 'Socios registrados', value: 0 },
    { label: 'Entradas registradas', value: 0 },
    { label: 'Membresías', value: 0 },
    { label: 'Dispositivos', value: 0 },
  ];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = '';

    forkJoin({
      members: this.apiService.getMembers(),
      attendance: this.apiService.getAttendance(),
      memberships: this.apiService.getMemberships(),
      devices: this.apiService.getDevices(),
    }).subscribe({
      next: ({ members, attendance, memberships, devices }) => {
        this.stats = [
          { label: 'Socios registrados', value: members.length },
          { label: 'Entradas registradas', value: attendance.filter((item) => item.type === 'entrada').length },
          { label: 'Membresías', value: memberships.length },
          { label: 'Dispositivos', value: devices.length },
        ];
        this.recentAttendance = attendance.slice(0, 6);
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }
}
