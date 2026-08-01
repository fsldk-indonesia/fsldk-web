import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ArticleService } from '../../core/services/data.services';
import { Article } from '../../core/models/models';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <article class="section">
      <div class="container narrow">
        @if (loading()) {
          <div class="center-screen"><span class="spinner spinner-dark"></span></div>
        } @else {
          @if (item(); as a) {
            <nav class="crumb"><a routerLink="/">Beranda</a> / <a routerLink="/artikel">Artikel</a> / <span>Detail</span></nav>
            <span class="chip chip-green">{{ a.categoryName }}</span>
            <h1>{{ a.articleTitle }}</h1>
            <p class="meta">Oleh {{ a.authorName }} · {{ a.publishedDate | date:'d MMMM yyyy' }}</p>
            @if (a.articleImage) { <img class="cover" [src]="a.articleImage" [alt]="a.articleTitle"> }
            <div class="content" [innerHTML]="a.articleContent"></div>
            <a routerLink="/artikel" class="btn btn-outline mt-lg">← Kembali ke Artikel</a>
          } @else {
            <div class="text-center"><h2>Artikel tidak ditemukan</h2><a routerLink="/artikel" class="btn btn-primary mt">Kembali</a></div>
          }
        }
      </div>
    </article>
  `,
  styles: [`
    .narrow { max-width: 760px; }
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    h1 { margin: 12px 0; }
    .meta { color: var(--color-muted); font-size: .92rem; }
    .cover { width: 100%; border-radius: var(--radius-lg); margin: 20px 0 28px; aspect-ratio: 16/9; object-fit: cover; }
    .content { font-size: 1.08rem; line-height: 1.85; color: #2a2d33; }
  `],
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(ArticleService);
  item = signal<Article | null>(null);
  loading = signal(true);
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.svc.publicDetail(slug).subscribe({ next: (a) => { this.item.set(a); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
