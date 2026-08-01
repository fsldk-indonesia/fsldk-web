import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../core/services/data.services';
import { Category, News } from '../../core/models/models';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <section class="section">
      <div class="container">
        <div class="text-center" style="margin-bottom:32px">
          <span class="eyebrow">Berita &amp; Kabar Dakwah Kampus</span>
          <h1>Ikuti Cerita Gerak Dakwah Kampus</h1>
        </div>

        <div class="filters">
          <input class="form-control search" [(ngModel)]="search" (keyup.enter)="applySearch()" placeholder="Cari berita…">
          <div class="chips">
            <span class="chip" [class.active]="activeCat === ''" (click)="filterCat('')">Semua</span>
            @for (c of categories(); track c.categoryID) {
              <span class="chip" [class.active]="activeCat === c.categorySlug" (click)="filterCat(c.categorySlug)">{{ c.categoryName }}</span>
            }
          </div>
        </div>

        @if (loading()) {
          <div class="center-screen"><span class="spinner spinner-dark"></span></div>
        } @else {
          <div class="grid grid-3 mt-lg">
            @for (n of news(); track n.newsID) {
              <a class="news-card" [routerLink]="['/berita', n.newsSlug]">
                <div class="news-thumb">@if (n.newsImage) { <img [src]="n.newsImage" [alt]="n.newsTitle"> } @else { <span>FOTO BERITA</span> }</div>
                <div class="news-body">
                  <span class="chip chip-green">{{ n.categoryName }}</span>
                  <h3>{{ n.newsTitle }}</h3>
                  <p class="excerpt">{{ n.newsExcerpt }}</p>
                  <p class="meta">{{ n.authorName }} · {{ n.publishedDate | date:'d MMM yyyy' }}</p>
                </div>
              </a>
            } @empty { <p class="text-muted">Tidak ada berita ditemukan.</p> }
          </div>

          @if (count() > limit) {
            <div class="pager">
              <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)">Sebelumnya</button>
              <span>Halaman {{ page() }} dari {{ totalPages() }}</span>
              <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">Berikutnya</button>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    .filters { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .search { max-width: 460px; }
    .chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow .18s, transform .18s; }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: repeating-linear-gradient(45deg, #eef0ee, #eef0ee 12px, #e8eae8 12px, #e8eae8 24px); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.12rem; }
    .excerpt { color: var(--color-text-secondary); font-size: .9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 8px 0 0; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class NewsListComponent implements OnInit {
  private newsSvc = inject(NewsService);

  news = signal<News[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 9;
  search = '';
  activeCat = '';

  ngOnInit(): void {
    this.newsSvc.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.newsSvc.publicList({ page: this.page(), limit: this.limit, search: this.search, category: this.activeCat }).subscribe({
      next: (p) => { this.news.set(p.data); this.count.set(p.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  applySearch(): void { this.page.set(1); this.load(); }
  filterCat(slug: string): void { this.activeCat = slug; this.page.set(1); this.load(); }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }
}
