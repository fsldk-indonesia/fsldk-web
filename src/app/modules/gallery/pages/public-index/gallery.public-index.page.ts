import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { environment } from '../../../../../environments/environment';

/**
 * Public landing page for browsing galleries.
 */
@Component({
  selector: 'app-gallery-public-index',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, IconComponent, PaginationComponent],
  template: `
    <section class="section">
      <div class="container pb-xl">
        <!-- Page Header -->
        <div class="header-section text-center">
          <span class="eyebrow">Tentang Kami</span>
          <h1>Galeri Dokumentasi</h1>
          <p class="header-subtitle">
            Koleksi visual, momen kebersamaan, dan arsip perjalanan dakwah FSLDK Indonesia.
          </p>

          <!-- Sort Filter Controls -->
          <div class="sort-bar">
            <span class="sort-label"><app-icon name="filter" [size]="13" /> Urutkan:</span>
            <div class="sort-options">
              <button
                type="button"
                class="sort-pill"
                [class.active]="currentSort() === 'newest'"
                (click)="setSort('newest')"
              >
                Terkini
              </button>
              <button
                type="button"
                class="sort-pill"
                [class.active]="currentSort() === 'oldest'"
                (click)="setSort('oldest')"
              >
                Terlama
              </button>
            </div>
          </div>
        </div>

        <!-- Content State Handler -->
        @if (repo.loading()) {
          <div class="empty-state">
            <div class="spinner"></div>
            <p class="mt-sm text-muted">Memuat galeri dokumentasi...</p>
          </div>
        } @else if (repo.error()) {
          <div class="empty-state">
            <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
            <h3>Terjadi Kesalahan</h3>
            <p>{{ repo.error() }}</p>
            <button class="btn btn-outline mt-md" (click)="loadData()">Coba Lagi</button>
          </div>
        } @else if (repo.publicGalleries().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><app-icon name="images" [size]="48" /></div>
            <h3>Belum Ada Dokumentasi</h3>
            <p>Dokumentasi kegiatan belum ditambahkan atau tidak ditemukan.</p>
          </div>
        } @else {
          <!-- Gallery Cards Grid -->
          <div class="gallery-grid">
            @for (item of repo.publicGalleries(); track item.galleryID) {
              <article class="gallery-card">
                <a [routerLink]="['/tentang/galeri', item.galleryID]" class="card-media-link">
                  <div class="card-media-wrapper">
                    <img
                      [src]="imgUrl(item.coverImage)"
                      [alt]="item.eventName"
                      class="card-img"
                      loading="lazy"
                    />
                    <div class="card-img-overlay">
                      <span class="view-btn">
                        <app-icon name="images" [size]="16" /> Lihat Galeri
                      </span>
                    </div>

                    <!-- Media Badges -->
                    <div class="card-badges">
                      <span class="badge badge-photos">
                        <app-icon name="images" [size]="12" /> {{ item.totalPhotos }} Foto
                      </span>
                      @if (item.youtubeVideoID) {
                        <span class="badge badge-video">
                          <app-icon name="play-circle" [size]="12" /> Video
                        </span>
                      }
                    </div>
                  </div>
                </a>

                <div class="card-body">
                  <div class="card-meta">
                    @if (item.eventDate) {
                      <span class="card-date">
                        <app-icon name="calendar-days" [size]="12" />
                        {{ item.eventDate | date: 'd MMMM y' }}
                      </span>
                    }
                    <span class="card-event-tag">{{ item.eventName }}</span>
                  </div>

                  <h2 class="card-title">
                    <a [routerLink]="['/tentang/galeri', item.galleryID]">
                      {{ item.eventTheme }}
                    </a>
                  </h2>

                  <div class="card-footer">
                    <a [routerLink]="['/tentang/galeri', item.galleryID]" class="card-link">
                      Selengkapnya <app-icon name="arrow-right" [size]="13" />
                    </a>
                  </div>
                </div>
              </article>
            }
          </div>

          <!-- Pagination -->
          @if (repo.publicTotal() > limit) {
            <div class="pagination-wrapper">
              <app-pagination
                [page]="repo.publicPage()"
                [count]="repo.publicTotal()"
                [limit]="limit"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    .section {
      background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 200px, #fff 520px);
      min-height: 80vh;
      padding-top: 48px;
    }

    .header-section {
      margin-bottom: 40px;
    }

    .header-subtitle {
      max-width: 640px;
      margin: 8px auto 24px;
      color: var(--color-text-secondary);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .sort-bar {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      padding: 6px 16px;
      border-radius: 999px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .sort-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sort-options {
      display: flex;
      gap: 4px;
    }

    .sort-pill {
      background: transparent;
      border: none;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sort-pill:hover {
      background: var(--color-bg-alt);
    }

    .sort-pill.active {
      background: var(--color-primary);
      color: #fff;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .gallery-card {
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .gallery-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-md);
    }

    .card-media-link {
      display: block;
      text-decoration: none;
    }

    .card-media-wrapper {
      position: relative;
      width: 100%;
      padding-top: 62.5%; /* 16:10 aspect ratio */
      background: var(--color-bg-alt);
      overflow: hidden;
    }

    .card-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .gallery-card:hover .card-img {
      transform: scale(1.05);
    }

    .card-img-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .gallery-card:hover .card-img-overlay {
      opacity: 1;
    }

    .view-btn {
      background: rgba(255, 255, 255, 0.95);
      color: var(--color-primary-dark);
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .card-badges {
      position: absolute;
      bottom: 12px;
      left: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      z-index: 2;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      backdrop-filter: blur(8px);
      letter-spacing: 0.02em;
    }

    .badge-photos {
      background: rgba(15, 23, 42, 0.75);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .badge-video {
      background: rgba(220, 38, 38, 0.85);
      color: #fff;
    }

    .card-body {
      padding: 22px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .card-date {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .card-event-tag {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      padding: 3px 8px;
      border-radius: 4px;
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-title {
      font-size: 1.18rem;
      font-weight: 800;
      font-family: var(--font-heading);
      line-height: 1.4;
      margin: 0 0 16px;
    }

    .card-title a {
      color: var(--color-text);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .card-title a:hover {
      color: var(--color-primary);
    }

    .card-footer {
      margin-top: auto;
      padding-top: 14px;
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-link {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: gap 0.2s ease;
    }

    .card-link:hover {
      gap: 9px;
      color: var(--color-primary-dark);
    }

    .pagination-wrapper {
      margin-top: 48px;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 992px) {
      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
    }

    @media (max-width: 640px) {
      .gallery-grid {
        grid-template-columns: 1fr;
      }
      .section {
        padding-top: 32px;
      }
    }
  `],
})
export class GalleryPublicIndexPage implements OnInit {
  repo = inject(GalleryRepository);
  private title = inject(Title);

  limit = 9;
  currentSort = signal<'newest' | 'oldest'>('newest');

  ngOnInit(): void {
    this.title.setTitle('Galeri Dokumentasi - FSLDK Indonesia');
    this.loadData();
  }

  loadData(): void {
    this.repo.loadPublic(this.repo.publicPage(), this.limit, this.currentSort());
  }

  setSort(sort: 'newest' | 'oldest'): void {
    if (this.currentSort() === sort) return;
    this.currentSort.set(sort);
    this.repo.loadPublic(1, this.limit, sort);
  }

  onPageChange(newPage: number): void {
    this.repo.loadPublic(newPage, this.limit, this.currentSort());
    window.scrollTo({ top: 120, behavior: 'smooth' });
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
