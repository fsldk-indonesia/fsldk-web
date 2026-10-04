import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalBackdropDirective } from '../../../shared/modal-backdrop.directive';
import { CommentRepository } from '../repositories/comment.repository';
import { GifCategory, GifItem, MediaType } from '../entities/comment';

/**
 * Modal pemilih GIF/sticker (proxy GIPHY lewat backend) — dipakai bersama
 * oleh form komentar utama dan form balasan di setiap level thread.
 *
 * Overlay dipindah ke document.body (pola sama dengan PopupModalComponent/
 * BottomSheetComponent) supaya position:fixed-nya tidak terjebak containing
 * block leluhur manapun (mis. `.detail-main-section { overflow: hidden }`
 * di halaman detail Berita/Artikel) — sebelumnya itu yang bikin grid GIF
 * kepotong dan navbar ikut "nongol" di atas backdrop alih-alih ikut
 * terdim. Selalu di-mount (`[open]` input, bukan `@if` di pemanggil) supaya
 * transisi buka DAN tutup sama-sama sempat main, sama seperti popup lain.
 */
@Component({
  selector: 'app-gif-picker',
  standalone: true,
  imports: [FormsModule, ModalBackdropDirective],
  template: `
    <div class="gif-modal-backdrop" [class.active]="open" appModalBackdrop (backdropClose)="close.emit()" #overlayEl>
      <div class="gif-modal" [class.active]="open" (click)="$event.stopPropagation()">
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
    :host { display: contents; }
    .gif-modal-backdrop {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 300; padding: 10px;
      background: rgba(20,23,26,.5);
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-base) ease, visibility 0s linear var(--motion-base);
    }
    .gif-modal-backdrop.active {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-base) ease, visibility 0s linear 0s;
    }
    .gif-modal {
      background: #fff; border-radius: var(--radius-lg); padding: 20px; width: 100%; max-width: 420px; max-height: 95vh; display: flex; flex-direction: column; gap: 12px;
      opacity: 0; transform: scale(.9) translateY(14px);
      transition: opacity var(--motion-slow) var(--ease-out), transform var(--motion-slow) var(--ease-out);
    }
    .gif-modal.active { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .gif-modal-backdrop, .gif-modal { transition: none; } }
    .gif-modal-head { display: flex; align-items: center; justify-content: space-between; }
    .gif-tabs { display: flex; gap: 8px; }
    .gif-tab { border: none; background: var(--color-bg-alt); padding: 6px 14px; border-radius: var(--radius-full); font-weight: 600; cursor: pointer; color: var(--color-text-secondary); }
    .gif-tab.active { background: var(--color-primary); color: #fff; }
    .gif-close { border: none; background: none; font-size: 1.4rem; line-height: 1; cursor: pointer; color: var(--color-muted); }
    .gif-categories { display: flex; gap: 6px; flex-wrap: wrap; }
    .gif-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; overflow-y: auto; flex: 1; min-height: 160px; }
    .gif-item { border: none; padding: 0; background: var(--color-bg-alt); border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1; }
    .gif-item img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .gif-attribution { text-align: center; font-size: .75rem; color: var(--color-muted); }
  `],
})
export class GifPickerComponent implements AfterViewInit, OnDestroy {
  private commentRepo = inject(CommentRepository);

  // Setter (bukan field input biasa) karena harus memicu lazy-load data
  // persis saat `open` pertama kali berubah jadi true — field @Input biasa
  // cuma nilai, tidak ada hook untuk "bereaksi" ke perubahannya.
  private _open = false;
  @Input() set open(value: boolean) {
    this._open = value;
    if (value && !this.loaded) {
      this.loaded = true;
      this.search();
      this.commentRepo.gifCategories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    }
  }
  get open(): boolean { return this._open; }

  @Output() select = new EventEmitter<{ url: string; type: MediaType }>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('overlayEl', { static: true }) private overlayRef!: ElementRef<HTMLElement>;

  tab = signal<'gifs' | 'stickers'>('gifs');
  query = '';
  items = signal<GifItem[]>([]);
  categories = signal<GifCategory[]>([]);
  loading = signal(false);
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  // Data baru dimuat begitu pertama kali dibuka (bukan tiap komponen
  // dibuat) — komponen ini sekarang selalu ter-mount lewat `[open]`, jadi
  // tanpa guard ini tiap form komentar/balasan di thread akan langsung
  // memanggil gifSearch()/gifCategories() saat halaman dibuka meski
  // pickernya tidak pernah dibuka sama sekali.
  private loaded = false;

  ngAfterViewInit(): void {
    document.body.appendChild(this.overlayRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.overlayRef?.nativeElement.remove();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close.emit();
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
