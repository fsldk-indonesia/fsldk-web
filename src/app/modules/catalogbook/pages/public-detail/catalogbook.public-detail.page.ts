import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogBook } from '../../entities/catalog-book';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { IconComponent } from '../../../../shared/icon.component';
import { CatalogBookPublicDetailPresenter } from './catalogbook.public-detail.presenter';
import { CatalogBookPublicDetailView } from './catalogbook.public-detail.view';

type DetailTab = 'description' | 'synopsis' | 'discussion';

@Component({
  selector: 'app-catalogbook-public-detail-page',
  standalone: true,
  templateUrl: './catalogbook.public-detail.page.html',
  imports: [RouterLink, IconComponent, CommentSectionComponent],
  providers: [CatalogBookPublicDetailPresenter],
  styles: [`
    .layout { display: grid; grid-template-columns: 280px 1fr; gap: 40px; }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    .cover { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; }
    h1 { margin: 4px 0 8px; }
    .meta-list { display: flex; flex-direction: column; gap: 6px; margin: 16px 0; color: var(--color-text-secondary); font-size: .92rem; }
    .meta-list strong { color: var(--color-text); }
    .pdf-missing { margin-top: -12px; color: var(--color-muted); font-size: .9rem; font-style: italic; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
    .tabs { display: flex; gap: 8px; margin: 28px 0 14px; border-bottom: 1px solid var(--color-border); }
    .tab-btn { padding: 10px 4px; margin-right: 20px; border: none; background: none; font-weight: 600; color: var(--color-muted); cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: var(--color-primary-dark); border-color: var(--color-primary); }
    .content { font-size: 1.02rem; line-height: 1.8; color: var(--color-text); white-space: pre-wrap; }
    .fav-btn.liked { color: var(--color-primary-dark); border-color: var(--color-primary); }
  `],
})
export class CatalogBookPublicDetailPage implements OnInit, CatalogBookPublicDetailView {
  private presenter = inject(CatalogBookPublicDetailPresenter);
  private route = inject(ActivatedRoute);

  item = signal<CatalogBook | null>(null);
  loading = signal(true);
  liked = signal(false);
  tab = signal<DetailTab>('description');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  like(): void {
    if (this.liked() || !this.item()) return;
    this.liked.set(true);
    this.presenter.like(this.item()!.bookID);
  }

  setTab(tab: DetailTab): void { this.tab.set(tab); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBook(book: CatalogBook | null): void { this.item.set(book); }
  setFavoriteCount(count: number): void {
    const current = this.item();
    if (current) this.item.set({ ...current, favoriteCount: count });
  }
}
