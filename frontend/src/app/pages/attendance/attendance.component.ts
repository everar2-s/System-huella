import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { AttendanceLog } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
})
export class AttendanceComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  attendance: AttendanceLog[] = [];

  loading = false;
  error = '';

  filterSocio = '';
  filterDate = '';
  filterType = '';
  filterResult = '';

  ngOnInit() {
    this.loadAttendance();
  }

  get filteredAttendance() {
    const socio = this.normalizeText(this.filterSocio);
    const date = this.filterDate;
    const type = this.filterType;
    const result = this.filterResult;

    return [...this.attendance]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        return a.id - b.id;
      })
      .filter((log) => {
        const memberName = log.member?.fullName || '';
        const memberId = log.memberId?.toString() || '';
        const logDate = this.formatDateForInput(log.createdAt);

        const matchesSocio =
          !socio ||
          this.normalizeText(memberName).includes(socio) ||
          memberId.includes(socio);

        const matchesDate = !date || logDate === date;

        const matchesType = !type || log.type === type;

        const matchesResult =
          !result ||
          (result === 'permitido' && log.accessGranted) ||
          (result === 'denegado' && !log.accessGranted);

        return (
          matchesSocio &&
          matchesDate &&
          matchesType &&
          matchesResult
        );
      });
  }

  loadAttendance() {
    this.loading = true;
    this.error = '';

    this.apiService.getAttendance().subscribe({
      next: (attendance) => {
        this.attendance = attendance.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();

          if (dateA !== dateB) {
            return dateA - dateB;
          }

          return a.id - b.id;
        });

        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  clearFilters() {
    this.filterSocio = '';
    this.filterDate = '';
    this.filterType = '';
    this.filterResult = '';
  }

  typeClass(type: string) {
    if (type === 'entrada') return 'success';

    if (type === 'salida') return 'warning';

    return 'warning';
  }

  resultClass(accessGranted: boolean) {
    return accessGranted ? 'success' : 'danger';
  }

  resultText(accessGranted: boolean) {
    return accessGranted ? 'Permitido' : 'Denegado';
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private formatDateForInput(value: string) {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}