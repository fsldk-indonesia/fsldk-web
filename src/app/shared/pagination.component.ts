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
 * («/») + sebelumnya/berikutnya (‹/›) di kiri-kanan nomor halaman. BEDA dari
 * referensi aslinya: (1) semua tombol rounded-square (var(--radius-md)),
 * bukan pill/lingkaran penuh — sesuai permintaan eksplisit; (2) seluruh
 * baris tombol dibungkus SATU kartu putih (bukan tombol lepas ber-border
 * sendiri-sendiri mengambang di atas background section) — pola sama
 * seperti .tentang-tabs-bar (Beranda): kartu + tombol transparan, aktif
 * dapat gradient, supaya terasa satu kesatuan yang dirancang, bukan
 * kumpulan lingkaran lepas; (3) warna dipetakan ke token brand hijau
 * proyek ini, bukan teal ldksyahid-app.
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
        <div class="pgn-card">
          <div class="pgn-inner">
            <button type="button" class="pgn-nav pgn-edge" [disabled]="page <= 1" (click)="go(1)" aria-label="Halaman pertama">
              <app-icon name="chevrons-left" [size]="13" />
            </button>
            <button type="button" class="pgn-nav" [disabled]="page <= 1" (click)="go(page - 1)" aria-label="Halaman sebelumnya">
              <app-icon name="chevron-left" [size]="13" />
            </button>

            <span class="pgn-sep" aria-hidden="true"></span>

            <div class="pgn-pages">
              @for (p of pageList(); track $index) {
                @if (p === ELLIPSIS) {
                  <span class="pgn-ellipsis" aria-hidden="true"><span></span><span></span><span></span></span>
                } @else {
                  <button type="button" class="pgn-num" [class.active]="p === page" [attr.aria-current]="p === page ? 'page' : null" (click)="go(p)">{{ p }}</button>
                }
              }
            </div>

            <span class="pgn-sep" aria-hidden="true"></span>

            <button type="button" class="pgn-nav" [disabled]="page >= totalPages" (click)="go(page + 1)" aria-label="Halaman berikutnya">
              <app-icon name="chevron-right" [size]="13" />
            </button>
            <button type="button" class="pgn-nav pgn-edge" [disabled]="page >= totalPages" (click)="go(totalPages)" aria-label="Halaman terakhir">
              <app-icon name="chevrons-right" [size]="13" />
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .pgn-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .pgn-info { font-size: .82rem; color: var(--color-muted); }
    .pgn-info strong { color: var(--color-primary-dark); font-weight: 700; }

    /* ---------- Kartu pembungkus — SATU permukaan putih dengan border+shadow
       lembut, pola sama seperti .tentang-tabs-bar (Beranda). Ini yang
       menggantikan kesan "lingkaran-lingkaran lepas mengambang di atas
       background section" jadi satu komponen yang terasa dirancang. ---------- */
    .pgn-card {
      display: inline-flex; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 6px; box-shadow: var(--shadow-sm);
      max-width: 100%; overflow-x: auto;
    }
    .pgn-inner { display: flex; align-items: center; gap: 3px; flex-wrap: nowrap; }
    .pgn-pages { display: flex; align-items: center; gap: 3px; }

    /* Garis pemisah tipis antar kelompok (lompat-halaman / nomor / navigasi)
       — cuma tampil kalau ada dua kelompok yang benar-benar bersebelahan
       (mis. hilang otomatis di ujung kalau salah satu kelompoknya kosong,
       tidak relevan di sini karena kelompoknya selalu ada keduanya). */
    .pgn-sep { width: 1px; align-self: stretch; margin: 6px 3px; background: var(--color-border); flex-shrink: 0; }

    /* ---------- Tombol — rounded-square (var(--radius-md)), TANPA border
       sendiri (kartu pembungkus yang jadi wadahnya) — transparan sampai
       di-hover/aktif, konsisten dengan pola tab pill lain di app ini. ---------- */
    .pgn-nav, .pgn-num {
      height: 40px; min-width: 40px; padding: 0 12px;
      border: none; border-radius: var(--radius-md);
      background: transparent; color: var(--color-text-secondary);
      font-size: .85rem; font-weight: 700; line-height: 1;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      transition: background var(--motion-base) var(--ease-out), color var(--motion-base) var(--ease-out),
        transform var(--motion-base) var(--ease-out), box-shadow var(--motion-base) var(--ease-out);
    }
    .pgn-nav { width: 40px; padding: 0; }

    @media (hover: hover) and (pointer: fine) {
      .pgn-nav:hover:not(:disabled) { background: var(--color-primary-soft); color: var(--color-primary-dark); }
      .pgn-num:hover:not(.active) { background: var(--color-primary-soft); color: var(--color-primary-dark); transform: translateY(-2px); }
    }

    .pgn-num.active {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: #fff; font-weight: 800;
      box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary) 40%, transparent);
      animation: pgnActivePop .35s var(--ease-out);
      cursor: default;
    }
    @keyframes pgnActivePop { from { transform: scale(.85); } to { transform: scale(1); } }

    .pgn-nav:disabled {
      color: var(--color-border-strong); background: transparent; cursor: not-allowed;
    }

    /* Titik-titik "…" sebagai 3 dot kecil rata tengah (bukan lagi karakter
       teks nempel di bawah) — lebih rapi & konsisten tingginya dengan
       tombol di sekelilingnya. */
    .pgn-ellipsis {
      width: 32px; height: 40px; display: flex; align-items: center; justify-content: center; gap: 3px;
      flex-shrink: 0; user-select: none;
    }
    .pgn-ellipsis span { width: 4px; height: 4px; border-radius: 50%; background: var(--color-border-strong); }

    @media (max-width: 480px) {
      .pgn-wrap { gap: 12px; }
      .pgn-card { padding: 4px; }
      .pgn-inner, .pgn-pages { gap: 2px; }
      .pgn-nav, .pgn-num { height: 34px; min-width: 34px; padding: 0 8px; font-size: .78rem; }
      .pgn-nav { width: 34px; }
      .pgn-sep { margin: 4px 1px; }
      .pgn-ellipsis { width: 24px; height: 34px; }
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
