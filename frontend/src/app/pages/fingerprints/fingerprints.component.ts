import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Fingerprint, Member } from '../../core/models';
import { getErrorMessage } from '../../core/error.util';

@Component({
  selector: 'app-fingerprints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fingerprints.component.html',
  styleUrl: './fingerprints.component.css',
})
export class FingerprintsComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  members: Member[] = [];
  fingerprints: Fingerprint[] = [];
  loading = false;
  saving = false;
  error = '';
  success = '';

  form = {
    memberId: 1,
    fingerprintId: 1,
    fingerName: 'Índice derecho',
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';

    forkJoin({
      members: this.apiService.getMembers(),
      fingerprints: this.apiService.getFingerprints(),
    }).subscribe({
      next: ({ members, fingerprints }) => {
        this.members = members;
        this.fingerprints = fingerprints;
        if (members.length && !this.form.memberId) this.form.memberId = members[0].id;
        this.loading = false;
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  syncFingerprintId() {
    this.form.fingerprintId = Number(this.form.memberId);
  }

  createFingerprint() {
    this.saving = true;
    this.error = '';
    this.success = '';

    this.apiService.createFingerprint({
      memberId: Number(this.form.memberId),
      fingerprintId: Number(this.form.fingerprintId),
      fingerName: this.form.fingerName,
    }).subscribe({
      next: () => {
        this.success = 'Huella registrada correctamente.';
        this.saving = false;
        this.loadData();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  deleteFingerprint(id: number) {
    if (!confirm('¿Deseas eliminar esta huella?')) return;

    this.apiService.deleteFingerprint(id).subscribe({
      next: () => {
        this.success = 'Huella eliminada correctamente.';
        this.loadData();
      },
      error: (error) => {
        this.error = getErrorMessage(error);
      },
    });
  }
}
