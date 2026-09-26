import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Pagination reusable untuk tabel CMS (Berita, Artikel, Pengguna, Shortlink,
 * dst.) — dipakai lewat @Input page/limit/count supaya tiap halaman tetap
 * memegang sumber kebenaran datanya sendiri (page presenter memanggil
 * repository lagi saat pageChange terpicu), komponen ini murni tampilan.
 *
 * Nomor halaman ditampilkan langsung (bukan cuma Sebelumnya/Selanjutnya) —
 * kalau jumlah halaman banyak, sebagian di tengah diringkas jadi "…" supaya
 * baris pagination tidak melebar tak terkendali (lihat pageList()).
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages > 1) {
      <div class="pagination">
        <span class="pagination-info">Halaman {{ page }} dari {{ totalPages }} &middot; {{ count }} data</span>
        <div class="pagination-nav">
          <button type="button" class="pagination-btn pagination-arrow" [disabled]="page <= 1" (click)="go(page - 1)" aria-label="Halaman sebelumnya">‹</button>
          @for (p of pageList(); track $index) {
            @if (p === ELLIPSIS) {
              <span class="pagination-ellipsis">…</span>
            } @else {
              <button type="button" class="pagination-btn" [class.active]="p === page" (click)="go(p)">{{ p }}</button>
            }
          }
          <button type="button" class="pagination-btn pagination-arrow" [disabled]="page >= totalPages" (click)="go(page + 1)" aria-label="Halaman berikutnya">›</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 14px 18px; }
    .pagination-info { color: var(--color-muted); font-size: .85rem; }
    .pagination-nav { display: flex; align-items: center; gap: 4px; }
    .pagination-btn {
      min-width: 32px; height: 32px; padding: 0 8px; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      background: #fff; color: var(--color-text); font-size: .85rem; font-weight: 600; cursor: pointer;
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .pagination-btn:hover:not(:disabled):not(.active) { background: var(--color-primary-soft); border-color: var(--color-primary); }
    .pagination-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; cursor: default; }
    .pagination-btn:disabled { opacity: .4; cursor: not-allowed; }
    .pagination-arrow { font-size: 1rem; line-height: 1; }
    .pagination-ellipsis { min-width: 20px; text-align: center; color: var(--color-muted); font-size: .85rem; user-select: none; }
  `],
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() limit = 10;
  @Input() count = 0;
  @Output() pageChange = new EventEmitter<number>();

  readonly ELLIPSIS = -1;

  get totalPages(): number { return Math.max(1, Math.ceil(this.count / this.limit)); }

  go(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.pageChange.emit(p);
  }

  /** Windowed page list: first, last, current ±1, "…" for the gaps. */
  pageList(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const cur = this.page;
    const pages: number[] = [1];
    if (cur > 3) pages.push(this.ELLIPSIS);

    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let p = start; p <= end; p++) pages.push(p);

    if (cur < total - 2) pages.push(this.ELLIPSIS);
    pages.push(total);
    return pages;
  }
}
