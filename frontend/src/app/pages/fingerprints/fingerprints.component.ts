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

  currentPage = 1;
  itemsPerPage = 5;

  form = {
    memberId: 1,
    fingerprintId: 1,
    fingerName: 'Índice derecho',
  };

  ngOnInit() {
    this.loadData();
  }

  get sortedFingerprints() {
    return [...this.fingerprints].sort((a, b) => a.id - b.id);
  }

  get totalPages() {
    return Math.ceil(this.sortedFingerprints.length / this.itemsPerPage);
  }

  get safeCurrentPage() {
    if (this.totalPages === 0) {
      return 1;
    }

    return Math.min(Math.max(this.currentPage, 1), this.totalPages);
  }

  get paginatedFingerprints() {
    const page = this.safeCurrentPage;
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    return this.sortedFingerprints.slice(start, end);
  }

  get pages() {
    const total = this.totalPages;
    const maxButtons = 5;

    if (total <= maxButtons) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    let start = Math.max(
      1,
      this.safeCurrentPage - Math.floor(maxButtons / 2),
    );

    let end = start + maxButtons - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index,
    );
  }

  get startItem() {
    if (!this.sortedFingerprints.length) {
      return 0;
    }

    return (this.safeCurrentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem() {
    const end = this.safeCurrentPage * this.itemsPerPage;

    return end > this.sortedFingerprints.length
      ? this.sortedFingerprints.length
      : end;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
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
        this.fingerprints = fingerprints.sort((a, b) => a.id - b.id);

        if (members.length && !this.form.memberId) {
          this.form.memberId = members[0].id;
          this.form.fingerprintId = members[0].id;
        }

        this.currentPage = 1;
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

    this.apiService
      .createFingerprint({
        memberId: Number(this.form.memberId),
        fingerprintId: Number(this.form.fingerprintId),
        fingerName: this.form.fingerName,
      })
      .subscribe({
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
    if (!confirm('¿Deseas eliminar esta huella?')) {
      return;
    }

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