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
      <a routerLink="/cms/galleries/create" class="btn btn-primary">+ Tambah Galeri</a>
    </div>

    <!-- Data Table Card with Integrated Search Filter -->
    <div class="card">
      <div class="card-pad flex gap items-center" style="flex-wrap: wrap">
        <input
          type="text"
          class="form-control"
          style="max-width: 320px"
          placeholder="Cari kegiatan atau tema…"
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearch($event)"
        />
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px"></th>
              <th>Nama Kegiatan &amp; Tema</th>
              <th>Total Foto</th>
              <th>Video</th>
              <th>Tanggal Kegiatan</th>
              <th>Dibuat Pada</th>
              <th style="width: 120px"></th>
            </tr>
          </thead>
          <tbody>
            @if (repo.loading()) {
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr>
                  <td><span class="skel" style="width: 44px; height: 44px; border-radius: 6px; display: block"></span></td>
                  <td><span class="skel skel-line" style="width: 70%"></span></td>
                  <td><span class="skel skel-line" style="width: 70px; border-radius: 999px"></span></td>
                  <td><span class="skel skel-line" style="width: 50px; border-radius: 999px"></span></td>
                  <td><span class="skel skel-line" style="width: 90px"></span></td>
                  <td><span class="skel skel-line" style="width: 90px"></span></td>
                  <td><span class="skel skel-line" style="width: 80px"></span></td>
                </tr>
              }
            } @else if (repo.error()) {
              <tr>
                <td colspan="7" class="text-center py-xl text-danger">
                  <app-icon name="alert-triangle" [size]="24" class="mb-sm" />
                  <div>{{ repo.error() }}</div>
                  <button class="btn btn-sm btn-outline mt-sm" (click)="loadData()">Coba Lagi</button>
                </td>
              </tr>
            } @else {
              @for (item of repo.cmsGalleries()?.data || []; track item.galleryID) {
                <tr>
                  <td>
                    <img
                      [src]="imgUrl(item.coverImage)"
                      [alt]="item.eventName"
                      class="thumb"
                      style="width: 44px; height: 44px; border-radius: var(--radius-xs); object-fit: cover"
                    />
                  </td>
                  <td>
                    <strong>{{ item.eventTheme }}</strong>
                    <div class="text-muted" style="font-size: .82rem">{{ item.eventName }}</div>
                  </td>
                  <td>
                    <span class="badge badge-published">
                      <app-icon name="images" [size]="11" /> {{ item.totalPhotos }} foto
                    </span>
                  </td>
                  <td>
                    @if (item.youtubeVideoID) {
                      <span class="badge" style="background: rgba(220, 38, 38, 0.1); color: #dc2626">
                        <app-icon name="play-circle" [size]="11" /> Ada
                      </span>
                    } @else {
                      <span class="text-muted">–</span>
                    }
                  </td>
                  <td class="text-muted">
                    {{ item.eventDate ? (item.eventDate | date: 'd MMM yyyy') : '–' }}
                  </td>
                  <td class="text-muted">{{ item.createdDate | date: 'd MMM yyyy' }}</td>
                  <td>
                    <div class="table-actions">
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
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty-state">
                      <span class="icon-badge lg icon-badge-soft" style="margin: 0 auto 14px">
                        <app-icon name="photo" [size]="26" />
                      </span>
                      <h4>Belum ada data galeri</h4>
                      <p>Dokumentasi galeri kegiatan yang Anda buat akan muncul di sini.</p>
                      <a routerLink="/cms/galleries/create" class="btn btn-primary btn-sm">+ Tambah Galeri</a>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (!repo.loading() && (repo.cmsGalleries()?.count || 0) > limit()) {
        <app-pagination
          [page]="page()"
          [count]="repo.cmsGalleries()!.count"
          [limit]="limit()"
          (pageChange)="onPageChange($event)"
        />
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
