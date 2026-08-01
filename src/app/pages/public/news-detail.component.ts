import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NewsService } from '../../core/services/data.services';
import { News } from '../../core/models/models';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <article class="section">
      <div class="container narrow">
        @if (loading()) {
          <div class="center-screen"><span class="spinner spinner-dark"></span></div>
        } @else {
          @if (news(); as n) {
            <nav class="crumb"><a routerLink="/">Beranda</a> / <a routerLink="/berita">Berita</a> / <span>Detail</span></nav>
            <span class="chip chip-green">{{ n.categoryName }}</span>
            <h1>{{ n.newsTitle }}</h1>
            <p class="meta">Oleh {{ n.authorName }} · {{ n.publishedDate | date:'d MMMM yyyy' }} · {{ n.viewCount }} kali dibaca</p>
            @if (n.newsImage) { <img class="cover" [src]="n.newsImage" [alt]="n.newsTitle"> }
            @else { <div class="cover placeholder">FOTO BERITA</div> }
            <div class="content" [innerHTML]="n.newsContent"></div>
            <a routerLink="/berita" class="btn btn-outline mt-lg">← Kembali ke Berita</a>
          } @else {
            <div class="text-center"><h2>Berita tidak ditemukan</h2><a routerLink="/berita" class="btn btn-primary mt">Kembali ke Berita</a></div>
          }
        }
      </div>
    </article>
  `,
  styles: [`
    .narrow { max-width: 760px; }
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    h1 { margin: 12px 0; font-size: clamp(1.8rem, 4vw, 2.6rem); }
    .meta { color: var(--color-muted); font-size: .92rem; }
    .cover { width: 100%; border-radius: var(--radius-lg); margin: 20px 0 28px; aspect-ratio: 16/9; object-fit: cover; }
    .cover.placeholder { background: repeating-linear-gradient(45deg, #eef0ee, #eef0ee 14px, #e8eae8 14px, #e8eae8 28px); display: flex; align-items: center; justify-content: center; color: var(--color-muted); letter-spacing: .1em; }
    .content { font-size: 1.08rem; line-height: 1.85; color: #2a2d33; }
    .content ::ng-deep p { margin: 0 0 1.2em; }
  `],
})
export class NewsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private newsSvc = inject(NewsService);
  news = signal<News | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.newsSvc.publicDetail(slug).subscribe({
      next: (n) => { this.news.set(n); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
