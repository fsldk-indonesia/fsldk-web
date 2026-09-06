import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StructureRepository } from '../../repositories/structure.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-structure-index',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, IconComponent, PaginationComponent],
  template: `
    <div class="flex justify-between items-center page-head">
      <div>
        <h1>Manajemen Struktur Organisasi</h1>
        <p class="text-muted">Kelola data kepengurusan dan formasi FSLDK Indonesia.</p>
      </div>
      <a routerLink="/cms/structures/create" class="btn btn-primary">+ Tambah Struktur</a>
    </div>

    <div class="card">
      <div class="card-pad flex gap" style="flex-wrap: wrap">
        <input
          type="text"
          class="form-control"
          style="max-width: 320px"
          placeholder="Cari angkatan, periode, atau nama…"
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearch($event)"
        />
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 70px">ID</th>
              <th>Nama Kepengurusan</th>
              <th>Angkatan / Periode</th>
              <th>Dibuat Pada</th>
              <th style="width: 100px"></th>
            </tr>
          </thead>
          <tbody>
            @if (repo.loading()) {
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr>
                  <td><span class="skel skel-line" style="width: 40px"></span></td>
                  <td><span class="skel skel-line" style="width: 70%"></span></td>
                  <td><span class="skel skel-line" style="width: 120px; border-radius: 999px"></span></td>
                  <td><span class="skel skel-line" style="width: 90px"></span></td>
                  <td><span class="skel skel-line" style="width: 60px"></span></td>
                </tr>
              }
            } @else if (repo.error()) {
              <tr>
                <td colspan="5" class="text-center py-xl text-danger">
                  <app-icon name="alert-triangle" [size]="24" class="mb-sm" />
                  <div>{{ repo.error() }}</div>
                  <button class="btn btn-sm btn-outline mt-sm" (click)="loadData()">Coba Lagi</button>
                </td>
              </tr>
            } @else {
              @for (item of repo.cmsStructures()?.data || []; track item.structureID) {
                <tr>
                  <td class="text-muted">#{{ item.structureID }}</td>
                  <td><strong>{{ item.structureName }}</strong></td>
                  <td><span class="badge badge-published">{{ item.batch }} ({{ item.period }})</span></td>
                  <td class="text-muted">{{ item.createdDate | date: 'd MMM yyyy' }}</td>
                  <td>
                    <div class="table-actions">
                      <a [routerLink]="['/cms/structures', item.structureID, 'edit']" class="icon-action" title="Edit">
                        <app-icon name="edit" [size]="14" />
                      </a>
                      <button
                        type="button"
                        class="icon-action danger"
                        title="Hapus"
                        (click)="confirmDelete(item.structureID, item.structureName, $event)"
                      >
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <div class="empty-state">
                      <span class="icon-badge lg icon-badge-soft" style="margin: 0 auto 14px">
                        <app-icon name="sitemap" [size]="26" />
                      </span>
                      <h4>Belum ada data struktur</h4>
                      <p>Data kepengurusan organisasi yang Anda buat akan muncul di sini.</p>
                      <a routerLink="/cms/structures/create" class="btn btn-primary btn-sm">+ Tambah Struktur</a>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (!repo.loading() && (repo.cmsStructures()?.count || 0) > limit()) {
        <app-pagination
          [page]="page()"
          [count]="repo.cmsStructures()!.count"
          [limit]="limit()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `
})
export class StructureIndexPage implements OnInit {
  repo = inject(StructureRepository);
  private title = inject(Title);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  page = signal(1);
  limit = signal(15);
  searchQuery = signal('');
  
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.title.setTitle('Struktur Organisasi - CMS FSLDK');
    this.loadData();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((val) => {
      this.searchQuery.set(val);
      this.page.set(1);
      this.loadData();
    });
  }

  loadData(): void {
    this.repo.loadCMS({
      page: this.page(),
      limit: this.limit(),
      search: this.searchQuery()
    });
  }

  onSearch(val: string): void {
    this.searchSubject.next(val);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadData();
  }

  async confirmDelete(id: number, name: string, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(
      `Hapus data struktur "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      {
        title: 'Hapus Struktur',
        confirmLabel: 'Ya, Hapus',
        variant: 'danger',
      },
      event
    );
    if (!ok) return;

    this.repo.delete(id).subscribe({
      next: () => {
        this.toast.success('Data struktur berhasil dihapus');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menghapus data struktur');
      }
    });
  }
}
