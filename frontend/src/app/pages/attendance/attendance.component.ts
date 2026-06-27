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
  filter = 'todos';

  ngOnInit() {
    this.loadAttendance();
  }

  get filteredAttendance() {
    if (this.filter === 'todos') return this.attendance;
    if (this.filter === 'permitidos') return this.attendance.filter((item) => item.accessGranted);
    if (this.filter === 'denegados') return this.attendance.filter((item) => !item.accessGranted);
    return this.attendance.filter((item) => item.type === this.filter);
  }

  loadAttendance() {
    this.loading = true;
    this.error = '';

    this.apiService.getAttendance().subscribe({
      next: (attendance) => {
        this.attendance = attendance;
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }
}
