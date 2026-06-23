import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CreateMemberPayload } from '../../../core/models/api.models';
import { MembersService } from '../../../core/services/members.service';

@Component({
  selector: 'app-member-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/members">Socios</a>

      <header class="page-header">
        <div>
          <h1 class="page-title">{{ isEditMode ? 'Editar socio' : 'Nuevo socio' }}</h1>
          <p class="page-subtitle">Datos básicos del socio.</p>
        </div>
      </header>

      <form class="panel" [formGroup]="form" (ngSubmit)="save()">
        <div *ngIf="error" class="message error">{{ error }}</div>

        <div class="form-grid">
          <label class="form-field">
            <span>Nombre completo</span>
            <input type="text" formControlName="fullName" placeholder="Juan Pérez" />
          </label>

          <label class="form-field">
            <span>Teléfono</span>
            <input type="text" formControlName="phone" placeholder="+52 614 123 4567" />
          </label>

          <label class="form-field">
            <span>Email (opcional)</span>
            <input type="email" formControlName="email" placeholder="correo@ejemplo.com" />
          </label>
        </div>

        <div class="form-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid || saving">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <a class="btn secondary" routerLink="/members">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class MemberFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly membersService = inject(MembersService);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
  });

  memberId = 0;
  isEditMode = false;
  saving = false;
  error = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.memberId = idParam ? Number(idParam) : 0;
    this.isEditMode = Boolean(this.memberId);

    if (this.isEditMode) {
      this.membersService.get(this.memberId).subscribe({
        next: (member) => {
          this.form.patchValue({
            fullName: member.fullName,
            phone: member.phone,
            email: member.email ?? '',
          });
        },
        error: () => {
          this.error = 'No se pudo cargar el socio.';
        },
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    const payload = this.getPayload();
    const request = this.isEditMode
      ? this.membersService.update(this.memberId, payload)
      : this.membersService.create(payload);

    request.subscribe({
      next: (member) => {
        void this.router.navigate(['/members', member.id]);
      },
      error: () => {
        this.error = 'No se pudo guardar el socio.';
        this.saving = false;
      },
    });
  }

  private getPayload(): CreateMemberPayload {
    const value = this.form.getRawValue();
    const payload: CreateMemberPayload = {
      fullName: value.fullName.trim(),
      phone: value.phone.trim(),
    };

    if (value.email.trim()) {
      payload.email = value.email.trim();
    }

    return payload;
  }
}
