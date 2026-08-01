import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NewsService, ContentService } from '../../core/services/data.services';
import { News } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <section class="hero">
      <div class="container">
        <span class="hero-badge">● {{ content()['home.hero.badge'] || '40 Tahun Merajut Ukhuwah · Sejak 1986' }}</span>
        <h1 class="hero-title">Menyatukan Langkah <span class="text-primary">Dakwah Kampus</span> se-Indonesia</h1>
        <p class="hero-sub">{{ content()['home.hero.subtitle'] || defaultSub }}</p>
        <div class="flex gap mt-lg">
          <a routerLink="/berita" class="btn btn-primary">Baca Berita</a>
          <a routerLink="/tentang" class="btn btn-outline">Tentang FSLDK</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="text-center" style="margin-bottom:40px">
          <span class="eyebrow">Berita &amp; Kabar Dakwah Kampus</span>
          <h2>Ikuti Cerita Gerak Dakwah Kampus</h2>
        </div>
        @if (loading()) {
          <div class="center-screen"><span class="spinner spinner-dark"></span></div>
        } @else {
          <div class="grid grid-3">
            @for (n of news(); track n.newsID) {
              <a class="news-card" [routerLink]="['/berita', n.newsSlug]">
                <div class="news-thumb">@if (n.newsImage) { <img [src]="n.newsImage" [alt]="n.newsTitle"> } @else { <span>FOTO BERITA</span> }</div>
                <div class="news-body">
                  <span class="chip chip-green">{{ n.categoryName }}</span>
                  <h3>{{ n.newsTitle }}</h3>
                  <p class="meta">{{ n.authorName }} · {{ n.publishedDate | date:'d MMM yyyy' }}</p>
                </div>
              </a>
            } @empty {
              <p class="text-muted">Belum ada berita dipublikasikan.</p>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .hero { background: linear-gradient(180deg, #ffffff 0%, var(--color-primary-soft) 100%); padding: 80px 0 90px; }
    .hero-badge { display: inline-block; background: #fff; border: 1px solid var(--color-border); color: var(--color-primary-dark); padding: 8px 18px; border-radius: 999px; font-weight: 600; font-size: .85rem; margin-bottom: 24px; }
    .hero-title { font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 800; max-width: 780px; line-height: 1.08; }
    .hero-sub { max-width: 620px; font-size: 1.12rem; color: var(--color-text-secondary); }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow .18s, transform .18s; }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: repeating-linear-gradient(45deg, #eef0ee, #eef0ee 12px, #e8eae8 12px, #e8eae8 24px); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.15rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 0; }
  `],
})
export class HomeComponent implements OnInit {
  private newsSvc = inject(NewsService);
  private contentSvc = inject(ContentService);

  news = signal<News[]>([]);
  content = signal<Record<string, string>>({});
  loading = signal(true);
  defaultSub = 'FSLDK Indonesia adalah forum silaturahmi dan pusat koordinasi bagi Lembaga Dakwah Kampus di seluruh negeri — merawat ukhuwah, membina kader, dan menggerakkan dakwah yang terpadu dan kompak.';

  ngOnInit(): void {
    this.contentSvc.profile().subscribe({ next: (c) => this.content.set(c), error: () => {} });
    this.newsSvc.publicList({ page: 1, limit: 6 }).subscribe({
      next: (p) => { this.news.set(p.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
