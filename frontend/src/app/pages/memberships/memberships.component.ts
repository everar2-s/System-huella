import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Member, Membership } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './memberships.component.html',
  styleUrl: './memberships.component.css',
})
export class MembershipsComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  members: Member[] = [];
  memberships: Membership[] = [];

  loading = false;
  saving = false;
  error = '';
  success = '';

  form = this.getEmptyForm();

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';

    forkJoin({
      members: this.apiService.getMembers(),
      memberships: this.apiService.getMemberships(),
    }).subscribe({
      next: ({ members, memberships }) => {
        this.members = members;
        this.memberships = memberships;

        if (members.length && !this.form.memberId) {
          this.form.memberId = members[0].id;
        }

        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  createMembership() {
    this.saving = true;
    this.error = '';
    this.success = '';

    this.apiService.createMembership({
      memberId: Number(this.form.memberId),
      type: this.form.type,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      price: Number(this.form.price),
    }).subscribe({
      next: () => {
        this.success = 'Membresía registrada correctamente.';
        this.form = this.getEmptyForm();

        if (this.members.length) {
          this.form.memberId = this.members[0].id;
        }

        this.saving = false;
        this.loadData();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  cancelMembership(id: number) {
    if (!confirm('¿Deseas cancelar esta membresía?')) return;

    this.apiService.cancelMembership(id).subscribe({
      next: () => {
        this.success = 'Membresía cancelada correctamente.';
        this.loadData();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
      },
    });
  }

  onTypeChange() {
    this.updateDatesByMembershipType();
  }

  onStartDateChange() {
    this.updateDatesByMembershipType();
  }

  private updateDatesByMembershipType() {
    if (!this.form.startDate) return;

    const startDate = this.parseDate(this.form.startDate);
    const endDate = new Date(startDate);

    switch (this.form.type) {
      case 'diaria':
        break;

      case 'semanal':
        endDate.setDate(endDate.getDate() + 7);
        break;

      case 'mensual':
        endDate.setMonth(endDate.getMonth() + 1);
        break;

      case 'anual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    this.form.endDate = this.formatDate(endDate);
  }

  statusClass(status: string) {
    if (status === 'activa') return 'success';
    if (status === 'cancelada' || status === 'vencida') return 'danger';
    return 'warning';
  }

  private getEmptyForm() {
    const today = new Date();
    const endDate = new Date(today);

    endDate.setMonth(endDate.getMonth() + 1);

    return {
      memberId: 0,
      type: 'mensual',
      startDate: this.formatDate(today),
      endDate: this.formatDate(endDate),
      price: 500,
    };
  }

  private parseDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}