import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Member } from '../../../core/models/api.models';
import { MembersService } from '../../../core/services/members.service';

@Component({
  selector: 'app-members-list',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Socios</h1>
          <p class="page-subtitle">Alta, consulta y seguimiento de socios del gimnasio.</p>
        </div>
        <a class="btn primary" routerLink="/members/new">+ Nuevo socio</a>
      </header>

      <div *ngIf="error" class="message error">{{ error }}</div>

      <div class="table-panel">
        <table class="data-table" *ngIf="members.length; else emptyMembers">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let member of members">
              <td>
                <a [routerLink]="['/members', member.id]">{{ member.fullName }}</a>
              </td>
              <td>{{ member.phone }}</td>
              <td>{{ member.email || '—' }}</td>
              <td>
                <span class="status" [ngClass]="member.status">
                  {{ formatStatus(member.status) }}
                </span>
              </td>
              <td>{{ member.createdAt | date: 'mediumDate' }}</td>
              <td>
                <div class="toolbar">
                  <a class="btn secondary" [routerLink]="['/members', member.id, 'edit']">
                    Editar
                  </a>
                  <a class="btn secondary" [routerLink]="['/members', member.id, 'fingerprint']">
                    Huella
                  </a>
                  <a class="btn secondary" [routerLink]="['/members', member.id, 'memberships']">
                    Membresías
                  </a>
                  <button class="btn danger" type="button" (click)="remove(member)">
                    Inactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyMembers>
          <div class="empty-state">
            {{ loading ? 'Cargando socios...' : 'No hay socios registrados.' }}
          </div>
        </ng-template>
      </div>
    </section>
  `,
})
export class MembersListComponent implements OnInit {
  private readonly membersService = inject(MembersService);

  members: Member[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.error = '';

    this.membersService.list().subscribe({
      next: (members) => {
        this.members = members;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los socios.';
        this.loading = false;
      },
    });
  }

  remove(member: Member): void {
    const confirmed = confirm(`¿Inactivar al socio ${member.fullName}?`);

    if (!confirmed) {
      return;
    }

    this.membersService.remove(member.id).subscribe({
      next: () => this.loadMembers(),
      error: () => {
        this.error = 'No se pudo inactivar el socio.';
      },
    });
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activo',
      EXPIRED: 'Vencido',
      PENDING_FINGERPRINT: 'Pendiente huella',
      SUSPENDED: 'Suspendido',
      INACTIVE: 'Inactivo',
    };
    return map[status] || status;
  }
}
