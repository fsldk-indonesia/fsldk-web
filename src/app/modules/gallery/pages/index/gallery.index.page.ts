import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { environment } from '../../../../../environments/environment';

/**
 * CMS index page for listing, filtering, and managing gallery entries.
 */
@Component({
  selector: 'app-gallery-index',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, IconComponent, PaginationComponent],
  template: `
    <div class="flex justify-between items-center page-head">
      <div>
        <h1>Manajemen Galeri</h1>
        <p class="text-muted">Kelola koleksi foto, video dokumentasi, dan kegiatan FSLDK Indonesia.</p>
      </div>
      <a routerLink="/cms/galleries/create" class="btn btn-primary">
        + Tambah Galeri
      </a>
    </div>

    <!-- Search & Filters -->
    <div class="card card-pad mb-md">
      <div class="flex gap items-center" style="flex-wrap: wrap">
        <div class="search-input-wrapper">
          <app-icon name="search" [size]="14" class="search-icon" />
          <input
            type="text"
            class="form-control"
            style="padding-left: 36px; max-width: 360px"
            placeholder="Cari event atau tema kegiatan..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 60px">ID</th>
              <th style="width: 80px">Cover</th>
              <th>Nama Kegiatan & Tema</th>
              <th style="width: 110px">Total Foto</th>
              <th style="width: 90px">Video</th>
              <th style="width: 140px">Tanggal Kegiatan</th>
              <th style="width: 130px">Dibuat Pada</th>
              <th style="text-align: right; width: 140px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @if (repo.loading()) {
              <tr>
                <td colspan="8" class="text-center py-xl text-muted">
                  <div class="spinner"></div> Memuat data...
                </td>
              </tr>
            } @else if (repo.error()) {
              <tr>
                <td colspan="8" class="text-center py-xl text-danger">
                  <app-icon name="alert-triangle" [size]="24" class="mb-sm" />
                  <div>{{ repo.error() }}</div>
                  <button class="btn btn-sm btn-outline mt-sm" (click)="loadData()">Coba Lagi</button>
                </td>
              </tr>
            } @else if (!repo.cmsGalleries() || repo.cmsGalleries()!.data.length === 0) {
              <tr>
                <td colspan="8" class="text-center py-xl text-muted">
                  <app-icon name="inbox" [size]="32" class="mb-sm" />
                  <div>Belum ada data galeri.</div>
                </td>
              </tr>
            } @else {
              @for (item of repo.cmsGalleries()!.data; track item.galleryID) {
                <tr>
                  <td class="text-muted">#{{ item.galleryID }}</td>
                  <td>
                    <img
                      [src]="imgUrl(item.coverImage)"
                      [alt]="item.eventName"
                      class="table-cover-thumb"
                    />
                  </td>
                  <td>
                    <div style="font-weight: 700; color: var(--color-text)">{{ item.eventTheme }}</div>
                    <div class="text-muted text-sm">{{ item.eventName }}</div>
                  </td>
                  <td>
                    <span class="chip chip-blue">
                      <app-icon name="images" [size]="12" /> {{ item.totalPhotos }} foto
                    </span>
                  </td>
                  <td>
                    @if (item.youtubeVideoID) {
                      <span class="chip chip-red"><app-icon name="play-circle" [size]="12" /> Ada</span>
                    } @else {
                      <span class="text-muted text-sm">-</span>
                    }
                  </td>
                  <td>
                    @if (item.eventDate) {
                      <span class="chip chip-green">
                        <app-icon name="calendar-days" [size]="12" />
                        {{ item.eventDate | date: 'd MMM y' }}
                      </span>
                    } @else {
                      <span class="text-muted text-sm">-</span>
                    }
                  </td>
                  <td class="text-muted text-sm">{{ item.createdDate | date: 'd MMM y' }}</td>
                  <td style="text-align: right">
                    <div class="table-actions" style="justify-content: flex-end">
                      <a
                        [routerLink]="['/tentang/galeri', item.galleryID]"
                        target="_blank"
                        class="icon-action"
                        title="Lihat Halaman Publik"
                      >
                        <app-icon name="eye" [size]="14" />
                      </a>
                      <a
                        [routerLink]="['/cms/galleries', item.galleryID, 'edit']"
                        class="icon-action"
                        title="Edit Galeri"
                      >
                        <app-icon name="edit" [size]="14" />
                      </a>
                      <button
                        type="button"
                        class="icon-action danger"
                        title="Hapus Galeri"
                        (click)="confirmDelete(item.galleryID, item.eventTheme, $event)"
                      >
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (repo.cmsGalleries() && repo.cmsGalleries()!.count > limit()) {
        <div style="padding: 16px; border-top: 1px solid var(--color-border); display: flex; justify-content: center">
          <app-pagination
            [page]="page()"
            [count]="repo.cmsGalleries()!.count"
            [limit]="limit()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .search-input-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 100%;
      max-width: 360px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--color-text-muted);
      pointer-events: none;
    }

    .table-cover-thumb {
      width: 60px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-alt);
    }

    .chip-blue {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .chip-red {
      background: rgba(220, 38, 38, 0.1);
      color: #dc2626;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .chip-green {
      background: rgba(13, 92, 59, 0.1);
      color: #0d5c3b;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  `],
})
export class GalleryIndexPage implements OnInit {
  repo = inject(GalleryRepository);
  private title = inject(Title);
  private toast = inject(ToastService);
  private alert = inject(AlertService);

  page = signal(1);
  limit = signal(15);
  searchQuery = signal('');

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.title.setTitle('Manajemen Galeri - CMS FSLDK');
    this.loadData();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.page.set(1);
        this.loadData();
      });
  }

  loadData(): void {
    this.repo.loadCMS({
      page: this.page(),
      limit: this.limit(),
      search: this.searchQuery(),
      sort_by: 'createdDate',
      sort_order: 'desc',
    });
  }

  onSearch(val: string): void {
    this.search$.next(val);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadData();
  }

  async confirmDelete(id: number, title: string, event?: MouseEvent): Promise<void> {
    const ok = await this.alert.confirm(
      `Hapus galeri "${title}"? Semua foto terkait akan ikut terhapus secara permanen.`,
      {
        title: 'Hapus Galeri',
        confirmLabel: 'Ya, Hapus',
        cancelLabel: 'Batal',
        variant: 'danger',
      },
      event,
    );
    if (!ok) return;

    this.repo.delete(id).subscribe({
      next: () => {
        this.toast.success('Galeri berhasil dihapus');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menghapus galeri');
      },
    });
  }

  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }
}
