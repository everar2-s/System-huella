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
  creating = false;
  renewing = false;

  error = '';
  success = '';

  filterSearch = '';
  filterType = '';
  filterStatus = '';

  form = this.getEmptyForm();

  ngOnInit() {
    this.loadData();
  }

  get filteredMemberships() {
    const searchRaw = this.filterSearch.trim();
    const searchText = this.normalizeText(searchRaw);
    const searchNumber = Number(searchRaw);

    const isNumericSearch =
      searchRaw !== '' && !Number.isNaN(searchNumber);

    const type = this.filterType;
    const status = this.filterStatus;

    return [...this.memberships]
      .sort((a, b) => a.id - b.id)
      .filter((membership) => {
        const memberName = this.normalizeText(
          membership.member?.fullName || '',
        );

        let matchesSearch = true;

        if (searchRaw) {
          if (isNumericSearch) {
            matchesSearch =
              membership.id === searchNumber ||
              membership.memberId === searchNumber;
          } else {
            matchesSearch = memberName.includes(searchText);
          }
        }

        const matchesType = !type || membership.type === type;

        const matchesStatus = !status || membership.status === status;

        return matchesSearch && matchesType && matchesStatus;
      });
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
        this.memberships = memberships.sort((a, b) => a.id - b.id);
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  clearFilters() {
    this.filterSearch = '';
    this.filterType = '';
    this.filterStatus = '';
  }

  get availableMembers() {
    const unavailableMemberIds = this.memberships
      .filter(
        (membership) =>
          membership.status === 'activa' ||
          membership.status === 'suspendida',
      )
      .map((membership) => membership.memberId);

    return this.members.filter(
      (member) => !unavailableMemberIds.includes(member.id),
    );
  }

  canRenew(membership: Membership) {
    return (
      membership.status === 'activa' ||
      membership.status === 'suspendida'
    );
  }

  openCreate() {
    this.error = '';
    this.success = '';
    this.renewing = false;

    if (!this.availableMembers.length) {
      this.error =
        'No hay socios disponibles. Todos tienen una membresía activa o suspendida.';
      return;
    }

    this.form = this.getEmptyForm();
    this.form.memberId = this.availableMembers[0].id;

    this.creating = true;
  }

  openRenew(membership: Membership) {
    this.error = '';
    this.success = '';
    this.renewing = true;

    this.form = this.getEmptyForm();
    this.form.memberId = membership.memberId;

    this.creating = true;
  }

  cancelCreate() {
    this.creating = false;
    this.renewing = false;
    this.form = this.getEmptyForm();
  }

  submitMembership() {
    if (this.renewing) {
      this.renewMembership();
    } else {
      this.createMembership();
    }
  }

  createMembership() {
    this.error = '';
    this.success = '';

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    const data = this.buildMembershipData();

    this.apiService.createMembership(data).subscribe({
      next: () => {
        this.success = 'Membresía registrada correctamente.';
        this.saving = false;
        this.cancelCreate();
        this.loadData();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  renewMembership() {
    this.error = '';
    this.success = '';

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    const data = this.buildMembershipData();

    this.apiService.renewMembership(data).subscribe({
      next: () => {
        this.success = 'Membresía renovada correctamente.';
        this.saving = false;
        this.cancelCreate();
        this.loadData();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  cancelMembership(id: number) {
    const confirmCancel = confirm(
      '¿Seguro que deseas cancelar esta membresía?',
    );

    if (!confirmCancel) {
      return;
    }

    this.error = '';
    this.success = '';

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
    this.applyMembershipDefaults();
  }

  onStartDateChange() {
    this.applyMembershipDefaults(false);
  }

  statusClass(status: string) {
    if (status === 'activa') return 'success';

    if (status === 'suspendida') return 'warning';

    if (status === 'vencida' || status === 'cancelada') {
      return 'danger';
    }

    return 'warning';
  }

  private validateForm() {
    if (!this.form.memberId) {
      this.error = 'Selecciona un socio.';
      return false;
    }

    if (!this.form.startDate || !this.form.endDate) {
      this.error = 'Las fechas son obligatorias.';
      return false;
    }

    if (this.form.endDate < this.form.startDate) {
      this.error =
        'La fecha de fin no puede ser menor que la fecha de inicio.';
      return false;
    }

    if (this.form.price < 0) {
      this.error = 'El precio no puede ser negativo.';
      return false;
    }

    return true;
  }

  private buildMembershipData() {
    return {
      memberId: Number(this.form.memberId),
      type: this.form.type,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      price: Number(this.form.price),
    };
  }

  private getEmptyForm() {
    const today = new Date().toISOString().slice(0, 10);

    return {
      memberId: 0,
      type: 'mensual',
      startDate: today,
      endDate: this.calculateEndDate(today, 'mensual'),
      price: 500,
    };
  }

  private applyMembershipDefaults(updatePrice = true) {
    this.form.endDate = this.calculateEndDate(
      this.form.startDate,
      this.form.type,
    );

    if (!updatePrice) {
      return;
    }

    if (this.form.type === 'diaria') {
      this.form.price = 50;
    }

    if (this.form.type === 'semanal') {
      this.form.price = 150;
    }

    if (this.form.type === 'mensual') {
      this.form.price = 500;
    }

    if (this.form.type === 'anual') {
      this.form.price = 5000;
    }
  }

  private calculateEndDate(startDate: string, type: string) {
    const date = new Date(`${startDate}T00:00:00`);

    if (type === 'diaria') {
      date.setDate(date.getDate());
    }

    if (type === 'semanal') {
      date.setDate(date.getDate() + 7);
    }

    if (type === 'mensual') {
      date.setMonth(date.getMonth() + 1);
    }

    if (type === 'anual') {
      date.setFullYear(date.getFullYear() + 1);
    }

    return date.toISOString().slice(0, 10);
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}