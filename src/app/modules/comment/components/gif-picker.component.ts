import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommentRepository } from '../repositories/comment.repository';
import { GifCategory, GifItem, MediaType } from '../entities/comment';

/**
 * Modal pemilih GIF/sticker (proxy GIPHY lewat backend) — dipakai bersama
 * oleh form komentar utama dan form balasan di setiap level thread.
 */
@Component({
  selector: 'app-gif-picker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="gif-modal-backdrop" (click)="close.emit()">
      <div class="gif-modal" (click)="$event.stopPropagation()">
        <div class="gif-modal-head">
          <div class="gif-tabs">
            <button type="button" class="gif-tab" [class.active]="tab() === 'gifs'" (click)="switchTab('gifs')">GIF</button>
            <button type="button" class="gif-tab" [class.active]="tab() === 'stickers'" (click)="switchTab('stickers')">Sticker</button>
          </div>
          <button type="button" class="gif-close" (click)="close.emit()" aria-label="Tutup">&times;</button>
        </div>
        <input class="form-control" type="text" placeholder="Cari GIF/sticker…" [(ngModel)]="query" (ngModelChange)="onQueryChange()">
        @if (categories().length) {
          <div class="gif-categories">
            <span class="chip" [class.active]="query === ''" (click)="clearQuery()">🔥 Trending</span>
            @for (c of categories(); track c.slug) {
              <span class="chip" (click)="setQuery(c.name)">{{ c.name }}</span>
            }
          </div>
        }
        <div class="gif-grid">
          @if (loading()) {
            <p class="text-muted">Memuat…</p>
          } @else {
            @for (g of items(); track g.id) {
              <button type="button" class="gif-item" (click)="pick(g)">
                <img [src]="g.preview" [alt]="g.title">
              </button>
            } @empty {
              <p class="text-muted">Tidak ada hasil.</p>
            }
          }
        </div>
        <div class="gif-attribution">Powered by GIPHY</div>
      </div>
    </div>
  `,
  styles: [`
    .gif-modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
    .gif-modal { background: #fff; border-radius: var(--radius-lg); padding: 20px; width: 100%; max-width: 420px; max-height: 80vh; display: flex; flex-direction: column; gap: 12px; }
    .gif-modal-head { display: flex; align-items: center; justify-content: space-between; }
    .gif-tabs { display: flex; gap: 8px; }
    .gif-tab { border: none; background: var(--color-bg-alt); padding: 6px 14px; border-radius: var(--radius-full); font-weight: 600; cursor: pointer; color: var(--color-text-secondary); }
    .gif-tab.active { background: var(--color-primary); color: #fff; }
    .gif-close { border: none; background: none; font-size: 1.4rem; line-height: 1; cursor: pointer; color: var(--color-muted); }
    .gif-categories { display: flex; gap: 6px; flex-wrap: wrap; }
    .gif-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; overflow-y: auto; flex: 1; min-height: 160px; }
    .gif-item { border: none; padding: 0; background: var(--color-bg-alt); border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1; }
    .gif-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gif-attribution { text-align: center; font-size: .75rem; color: var(--color-muted); }
  `],
})
export class GifPickerComponent {
  private commentRepo = inject(CommentRepository);

  @Output() select = new EventEmitter<{ url: string; type: MediaType }>();
  @Output() close = new EventEmitter<void>();

  tab = signal<'gifs' | 'stickers'>('gifs');
  query = '';
  items = signal<GifItem[]>([]);
  categories = signal<GifCategory[]>([]);
  loading = signal(false);
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.search();
    this.commentRepo.gifCategories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
  }

  switchTab(tab: 'gifs' | 'stickers'): void { this.tab.set(tab); this.search(); }
  clearQuery(): void { this.query = ''; this.search(); }
  setQuery(q: string): void { this.query = q; this.search(); }

  onQueryChange(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.search(), 400);
  }

  private search(): void {
    this.loading.set(true);
    this.commentRepo.gifSearch(this.query, this.tab()).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  pick(item: GifItem): void {
    this.select.emit({ url: item.url, type: this.tab() === 'stickers' ? 'sticker' : 'gif' });
  }
}
