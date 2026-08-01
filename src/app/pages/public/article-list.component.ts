import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/data.services';
import { Article, Category } from '../../core/models/models';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <section class="section">
      <div class="container">
        <div class="text-center" style="margin-bottom:32px">
          <span class="eyebrow">Artikel &amp; Kajian</span>
          <h1>Gagasan &amp; Wawasan Dakwah Kampus</h1>
        </div>

        <div class="filters">
          <input class="form-control search" [(ngModel)]="search" (keyup.enter)="apply()" placeholder="Cari artikel…">
          <div class="chips">
            <span class="chip" [class.active]="cat === ''" (click)="filter('')">Semua</span>
            @for (c of categories(); track c.categoryID) {
              <span class="chip" [class.active]="cat === c.categorySlug" (click)="filter(c.categorySlug)">{{ c.categoryName }}</span>
            }
          </div>
        </div>

        @if (loading()) {
          <div class="center-screen"><span class="spinner spinner-dark"></span></div>
        } @else {
          <div class="grid grid-3 mt-lg">
            @for (a of items(); track a.articleID) {
              <a class="news-card" [routerLink]="['/artikel', a.articleSlug]">
                <div class="news-thumb">@if (a.articleImage) { <img [src]="a.articleImage" [alt]="a.articleTitle"> } @else { <span>ARTIKEL</span> }</div>
                <div class="news-body">
                  <span class="chip chip-green">{{ a.categoryName }}</span>
                  <h3>{{ a.articleTitle }}</h3>
                  <p class="excerpt">{{ a.articleExcerpt }}</p>
                  <p class="meta">{{ a.authorName }} · {{ a.publishedDate | date:'d MMM yyyy' }}</p>
                </div>
              </a>
            } @empty { <p class="text-muted">Belum ada artikel.</p> }
          </div>
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
  `],
})
export class ArticleListComponent implements OnInit {
  private svc = inject(ArticleService);
  items = signal<Article[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  search = '';
  cat = '';

  ngOnInit(): void {
    this.svc.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.svc.publicList({ page: 1, limit: 9, search: this.search, category: this.cat }).subscribe({
      next: (p) => { this.items.set(p.data); this.loading.set(false); }, error: () => this.loading.set(false),
    });
  }
  apply(): void { this.load(); }
  filter(s: string): void { this.cat = s; this.load(); }
}
