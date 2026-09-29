import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Pagination reusable untuk tabel CMS (Berita, Artikel, Pengguna, Shortlink,
 * dst.) maupun halaman publik (Galeri) — dipakai lewat @Input page/limit/count
 * supaya tiap halaman tetap memegang sumber kebenaran datanya sendiri (page
 * presenter memanggil repository lagi saat pageChange terpicu), komponen ini
 * murni tampilan.
 *
 * Desain diadaptasi dari komponen "pagination-custom" ldksyahid-app
 * (resources/views/components/pagination-custom/): baris info "Menampilkan
 * X–Y dari Z <label>" di atas, tombol lompat ke halaman pertama/terakhir
 * («/») + sebelumnya/berikutnya (‹/›) di kiri-kanan nomor halaman, aktif
 * terisi gradient dengan glow, non-aktif outline yang terisi solid saat
 * hover. BEDA dari referensi aslinya: semua tombol (termasuk «/») dibuat
 * rounded-square konsisten (var(--radius-md)) — bukan pill/lingkaran penuh
 * seperti referensi — sesuai permintaan eksplisit, dan warnanya dipetakan ke
 * token brand hijau proyek ini (--color-primary), bukan teal ldksyahid-app.
 *
 * Nomor halaman ditampilkan langsung (bukan cuma Sebelumnya/Selanjutnya) —
 * kalau jumlah halaman banyak, sebagian di tengah diringkas jadi "…" supaya
 * baris pagination tidak melebar tak terkendali (lihat pageList()).
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (totalPages > 1) {
      <div class="pgn-wrap">
        <div class="pgn-info">
          Menampilkan <strong>{{ firstItem }}–{{ lastItem }}</strong> dari <strong>{{ count }}</strong> {{ itemLabel }}
        </div>
        <div class="pgn-inner">
          <button type="button" class="pgn-nav pgn-edge" [disabled]="page <= 1" (click)="go(1)" aria-label="Halaman pertama">
            <app-icon name="chevrons-left" [size]="13" />
          </button>
          <button type="button" class="pgn-nav" [disabled]="page <= 1" (click)="go(page - 1)" aria-label="Halaman sebelumnya">
            <app-icon name="chevron-left" [size]="13" />
          </button>

          <div class="pgn-pages">
            @for (p of pageList(); track $index) {
              @if (p === ELLIPSIS) {
                <span class="pgn-ellipsis">&middot;&middot;&middot;</span>
              } @else {
                <button type="button" class="pgn-num" [class.active]="p === page" (click)="go(p)">{{ p }}</button>
              }
            }
          </div>

          <button type="button" class="pgn-nav" [disabled]="page >= totalPages" (click)="go(page + 1)" aria-label="Halaman berikutnya">
            <app-icon name="chevron-right" [size]="13" />
          </button>
          <button type="button" class="pgn-nav pgn-edge" [disabled]="page >= totalPages" (click)="go(totalPages)" aria-label="Halaman terakhir">
            <app-icon name="chevrons-right" [size]="13" />
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pgn-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .pgn-info { font-size: .82rem; color: var(--color-muted); }
    .pgn-info strong { color: var(--color-primary-dark); font-weight: 700; }

    .pgn-inner { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .pgn-pages { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }

    /* ---------- Basis bersama tombol nav (</>/«/») & nomor halaman — rounded-
       square (var(--radius-md)) di semua tombol, BUKAN pill/lingkaran seperti
       referensi ldksyahid-app (di sana «/» pakai radius asimetris 50px/14px
       supaya sisi luar bulat; di sini disamakan semua sisinya). ---------- */
    .pgn-nav, .pgn-num {
      height: 40px; min-width: 40px; padding: 0 10px;
      border: 1.5px solid var(--color-primary); border-radius: var(--radius-md);
      background: #fff; color: var(--color-primary-dark);
      font-size: .85rem; font-weight: 700; line-height: 1;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      transition: background var(--motion-base) var(--ease-out), color var(--motion-base) var(--ease-out),
        border-color var(--motion-base) ease, transform var(--motion-base) var(--ease-out), box-shadow var(--motion-base) var(--ease-out);
    }
    .pgn-nav { width: 40px; padding: 0; }

    @media (hover: hover) and (pointer: fine) {
      .pgn-nav:hover:not(:disabled), .pgn-num:hover:not(.active) {
        background: var(--color-primary); color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px color-mix(in srgb, var(--color-primary) 30%, transparent);
      }
    }

    .pgn-num.active {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      border-color: transparent; color: #fff; font-weight: 800;
      transform: translateY(-3px) scale(1.06);
      box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 38%, transparent);
      cursor: default;
    }

    .pgn-nav:disabled {
      color: var(--color-muted); border-color: var(--color-border);
      background: var(--color-bg-alt); cursor: not-allowed; opacity: .55;
    }

    .pgn-ellipsis {
      width: 28px; height: 40px; display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 6px; color: var(--color-primary); font-weight: 800; font-size: .8rem;
      letter-spacing: 2px; opacity: .7; user-select: none;
    }

    @media (max-width: 480px) {
      .pgn-wrap { gap: 10px; }
      .pgn-inner { gap: 5px; }
      .pgn-pages { order: -1; width: 100%; gap: 5px; }
      .pgn-nav, .pgn-num { height: 34px; min-width: 34px; font-size: .78rem; }
      .pgn-nav { width: 34px; }
      .pgn-ellipsis { height: 34px; font-size: .72rem; }
      .pgn-info { font-size: .78rem; text-align: center; }
    }
  `],
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() limit = 10;
  @Input() count = 0;
  /** Kata benda jamak untuk baris info, mis. "artikel"/"galeri"/"berita" —
   *  default generik supaya call site lama yang belum diisi tetap masuk akal. */
  @Input() itemLabel = 'item';
  @Output() pageChange = new EventEmitter<number>();

  readonly ELLIPSIS = -1;

  get totalPages(): number { return Math.max(1, Math.ceil(this.count / this.limit)); }
  get firstItem(): number { return this.count === 0 ? 0 : (this.page - 1) * this.limit + 1; }
  get lastItem(): number { return Math.min(this.page * this.limit, this.count); }

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
