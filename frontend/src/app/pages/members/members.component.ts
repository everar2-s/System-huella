import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { Member } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css',
})
export class MembersComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  members: Member[] = [];
  loading = false;
  saving = false;

  creating = false;
  editing = false;

  error = '';
  success = '';

  form = this.getEmptyForm();

  editForm = {
    id: 0,
    fullName: '',
    phone: '',
    email: '',
  };

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    this.loading = true;
    this.error = '';

    this.apiService.getMembers().subscribe({
      next: (members) => {
        this.members = members;
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
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

  createMember() {
    this.error = '';
    this.success = '';

    const fullName = this.form.fullName.trim();
    const phone = this.form.phone.trim();
    const email = this.form.email.trim();

    if (!fullName) {
      this.error = 'El nombre completo es obligatorio.';
      return;
    }

    this.saving = true;

    const data = {
      ...this.form,
      fullName,
      phone,
      email,
    };

    this.apiService.createMember(data).subscribe({
      next: () => {
        this.success = 'Socio registrado correctamente.';
        this.saving = false;
        this.cancelCreate();
        this.loadMembers();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  openEdit(member: Member) {
    this.error = '';
    this.success = '';
    this.editing = true;

    this.editForm = {
      id: member.id,
      fullName: member.fullName,
      phone: member.phone || '',
      email: member.email || '',
    };
  }

  cancelEdit() {
    this.editing = false;

    this.editForm = {
      id: 0,
      fullName: '',
      phone: '',
      email: '',
    };
  }

  updateMember() {
    this.error = '';
    this.success = '';

    const id = this.editForm.id;
    const fullName = this.editForm.fullName.trim();
    const phone = this.editForm.phone.trim();
    const email = this.editForm.email.trim();

    if (!fullName) {
      this.error = 'El nombre completo es obligatorio.';
      return;
    }

    this.saving = true;

    const data = {
      fullName,
      phone,
      email,
    };

    this.cancelEdit();

    this.apiService.updateMember(id, data).subscribe({
      next: () => {
        this.success = 'Socio actualizado correctamente.';
        this.saving = false;
        this.loadMembers();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  suspendMember(member: Member) {
    const confirmSuspend = confirm(
      `¿Seguro que deseas suspender a ${member.fullName}?`,
    );

    if (!confirmSuspend) {
      return;
    }

    this.error = '';
    this.success = '';

    this.apiService.suspendMember(member.id).subscribe({
      next: () => {
        this.success = 'Socio suspendido correctamente.';
        this.loadMembers();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
      },
    });
  }

  reactivateMember(member: Member) {
    const confirmReactivate = confirm(
      `¿Seguro que deseas reactivar a ${member.fullName}?`,
    );

    if (!confirmReactivate) {
      return;
    }

    this.error = '';
    this.success = '';

    this.apiService.reactivateMember(member.id).subscribe({
      next: () => {
        this.success = 'Socio reactivado correctamente.';
        this.loadMembers();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
      },
    });
  }

  statusClass(status: string) {
    if (status === 'activo') return 'success';

    if (
      status === 'vencido' ||
      status === 'suspendido' ||
      status === 'inactivo'
    ) {
      return 'danger';
    }

    return 'warning';
  }

  private getEmptyForm() {
    const today = new Date().toISOString().slice(0, 10);

    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    return {
      fullName: '',
      phone: '',
      email: '',
      membershipStart: today,
      membershipEnd: end.toISOString().slice(0, 10),
    };
  }
}