import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Pagination reusable untuk tabel CMS (Berita, Artikel, Pengguna, Shortlink)
 * — dipakai lewat @Input page/limit/count supaya tiap halaman tetap
 * memegang sumber kebenaran datanya sendiri (page presenter memanggil
 * repository lagi saat pageChange terpicu), komponen ini murni tampilan.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages > 1) {
      <div class="pagination">
        <button type="button" class="btn btn-outline btn-sm" [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">← Sebelumnya</button>
        <span class="pagination-info">Halaman {{ page }} dari {{ totalPages }} &middot; {{ count }} data</span>
        <button type="button" class="btn btn-outline btn-sm" [disabled]="page >= totalPages" (click)="pageChange.emit(page + 1)">Selanjutnya →</button>
      </div>
    }
  `,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() limit = 10;
  @Input() count = 0;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number { return Math.max(1, Math.ceil(this.count / this.limit)); }
}
