import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { ToastService, Toast, TOAST_AUTO_DISMISS_MS } from '../core/services/toast.service';
import { IconComponent } from './icon.component';

const ICON_BY_TYPE: Record<Toast['type'], string> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info-circle',
  warning: 'alert-triangle',
};
/** Kelas icon-badge yang SUDAH ada (dipakai di form-section-label Berita/
 *  Artikel/Pengguna dst. sesi ini) — dipakai ulang di sini supaya warna
 *  toast konsisten dengan sisa aplikasi, bukan palet baru. */
const BADGE_BY_TYPE: Record<Toast['type'], string> = {
  success: 'icon-badge-soft',
  error: 'icon-badge-danger',
  info: 'icon-badge-info',
  warning: 'icon-badge-gold',
};
const PROGRESS_BY_TYPE: Record<Toast['type'], string> = {
  success: 'toast-progress-success',
  error: 'toast-progress-danger',
  info: 'toast-progress-info',
  warning: 'toast-progress-warning',
};
/** Outline kartu per jenis — dipakai sebagai ganti shadow (dihapus, kartu
 *  putih di atas halaman putih polos butuh batas tegas, bukan cuma shadow
 *  tipis yang gampang "nyatu" dengan latar). */
const BORDER_BY_TYPE: Record<Toast['type'], string> = {
  success: 'toast-border-success',
  error: 'toast-border-danger',
  info: 'toast-border-info',
  warning: 'toast-border-warning',
};
/** Siluet ikon besar & pudar di ruang kosong kanan kartu — mengisi area yang
 *  sebelumnya kosong sekaligus menegaskan jenis toast tanpa mengulang warna
 *  baru (dipetakan ke token warna yang sama seperti border/progress-nya). */
const SILHOUETTE_BY_TYPE: Record<Toast['type'], string> = {
  success: 'toast-silhouette-success',
  error: 'toast-silhouette-danger',
  info: 'toast-silhouette-info',
  warning: 'toast-silhouette-warning',
};
/** Judul singkat per jenis — ToastService.success()/dst. cuma menerima satu
 *  string pesan (dipakai ~40+ tempat di seluruh app), jadi judul tebal tidak
 *  diminta per-panggilan; diturunkan otomatis dari jenisnya, pesan yang
 *  sudah dikirim tiap caller jadi baris deskripsi di bawahnya. */
const TITLE_BY_TYPE: Record<Toast['type'], string> = {
  success: 'Berhasil',
  error: 'Gagal',
  warning: 'Perhatian',
  info: 'Informasi',
};

/**
 * Kontainer notifikasi toast reusable (dipasang di root aplikasi). Kartu
 * putih + badge ikon bulat tint warna (bukan lagi pil warna solid) — badge
 * & ikonnya memakai kelas/token yang sudah ada di seluruh app, bukan palet
 * terpisah. Posisi vertikal (`top`) dihitung dinamis dari elemen navbar
 * yang sedang tampil (`.topbar` CMS yang selalu fixed, atau `.pub-header`
 * publik/Kader yang berubah relative<->fixed saat discroll — lihat
 * site-header.component.ts) lewat getBoundingClientRect(), BUKAN angka
 * piksel hardcode per shell yang gampang basi kalau tinggi navbar berubah.
 *
 * Tutup (auto-dismiss maupun klik manual) dianimasikan — toast TIDAK
 * langsung dicabut dari `toasts()`, cuma ditandai `closingIds` dulu (lihat
 * ToastService.dismiss) supaya transisi fade+collapse-nya kelihatan, baru
 * benar-benar hilang dari array setelah TOAST_EXIT_MS.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="toast-stack" [style.top.px]="navTop()">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast-item" [class.closing]="toast.closingIds().has(t.id)">
          <div class="toast-item-inner">
            <div class="toast" [class]="'toast ' + borderFor(t.type)" (click)="toast.dismiss(t.id)">
              <app-icon [name]="iconFor(t.type)" [size]="88" [class]="'toast-silhouette ' + silhouetteFor(t.type)" />
              <span class="icon-badge md" [class]="'icon-badge md ' + badgeFor(t.type)"><app-icon [name]="iconFor(t.type)" [size]="18" /></span>
              <div class="toast-text">
                <p class="toast-title">{{ titleFor(t.type) }}</p>
                <p class="toast-desc">{{ t.message }}</p>
              </div>
              <button type="button" class="toast-close" (click)="onCloseClick($event, t.id)" aria-label="Tutup"><app-icon name="x" [size]="12" /></button>
              <span class="toast-progress-track">
                <span class="toast-progress" [class]="'toast-progress ' + progressFor(t.type)" [style.animation-duration.ms]="duration"></span>
              </span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Lebih lebar dari draft pertama (360px) — pesan pendek jadi kelihatan
       "sesak" di kotak sempit, sekarang satu baris punya cukup ruang napas. */
    .toast-stack { position: fixed; right: 20px; z-index: 210; display: flex; flex-direction: column; gap: 10px; width: 420px; max-width: calc(100vw - 40px); transition: top .15s ease; }

    /* Wrapper luar animasi TUTUP dengan collapse grid-template-rows (bukan
       height/max-height langsung, sama pola dengan .collapse role Pengunjung
       di user.index.page.ts) — toast di bawahnya jadi ikut naik mulus,
       bukan "meloncat" instan begitu satu toast hilang dari array. */
    .toast-item { display: grid; grid-template-rows: 1fr; transition: grid-template-rows var(--motion-slow, 250ms) var(--ease-out, ease); }
    .toast-item.closing { grid-template-rows: 0fr; }
    .toast-item-inner { overflow: hidden; min-height: 0; }

    /* Tanpa shadow (dihapus) — batas kartu dari halaman putih polos sekarang
       murni dari outline berwarna sesuai jenis toast (lihat toast-border-*),
       bukan bayangan. */
    .toast {
      position: relative; display: flex; align-items: center; gap: 14px;
      padding: 16px 36px 18px 16px; border-radius: var(--radius-xs); background: #fff;
      border: 1.5px solid transparent;
      cursor: pointer; overflow: hidden;
      opacity: 1; transform: none;
      transition: opacity var(--motion-slow, 250ms) ease, transform var(--motion-slow, 250ms) ease;
      animation: toast-in var(--motion-slow, 250ms) var(--ease-out, ease);
    }
    .toast-item.closing .toast { opacity: 0; transform: translateX(16px) scale(.97); }
    .toast-border-success { border-color: var(--color-primary); }
    .toast-border-danger { border-color: var(--color-danger); }
    .toast-border-info { border-color: var(--color-info); }
    .toast-border-warning { border-color: var(--color-gold-dark); }

    /* Siluet ikon besar & pudar mengisi ruang kosong di kanan kartu, sebagian
       "bleed" keluar tepi (di-crop oleh overflow:hidden .toast) — murni
       dekoratif (pointer-events:none), diletakkan DI BELAKANG badge/teks/
       tombol tutup (z-index 0 vs 1) supaya tidak pernah menutupi konten. */
    .toast-silhouette { position: absolute; top: 50%; right: -14px; transform: translateY(-50%); z-index: 0; opacity: .07; pointer-events: none; }
    .toast-silhouette-success { color: var(--color-primary); }
    .toast-silhouette-danger { color: var(--color-danger); }
    .toast-silhouette-info { color: var(--color-info); }
    .toast-silhouette-warning { color: var(--color-gold-dark); }

    .icon-badge.md { position: relative; z-index: 1; }
    .toast-text { position: relative; z-index: 1; flex: 1; min-width: 0; }
    .toast-title { margin: 0 0 2px; font-family: var(--font-heading, inherit); font-weight: 700; font-size: .95rem; color: var(--color-text); }
    .toast-desc { margin: 0; font-family: var(--font-body, inherit); font-weight: 500; font-size: .86rem; line-height: 1.5; color: var(--color-text-secondary); }

    .toast-close {
      position: absolute; top: 12px; right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 22px; height: 22px; border-radius: 50%; border: none; background: transparent; color: var(--color-muted);
      cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .toast-close:hover { background: var(--color-bg-alt); color: var(--color-text); }

    /* Bar auto-dismiss — track abu-abu tipis di belakangnya supaya sisa waktu
       tetap kebaca sebagai "progress bar" sungguhan, bukan cuma garis warna
       yang menghilang begitu saja. Durasi animasinya di-bind dari
       TOAST_AUTO_DISMISS_MS (lihat toast.service.ts) supaya selalu sinkron
       persis dengan waktu toast sungguhan hilang. */
    .toast-progress-track { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--color-bg-alt); }
    /* transform-origin default (center) — bar mengecil dari kedua ujung ke
       tengah, bukan nempel kiri lalu habis ke kanan. */
    .toast-progress { display: block; height: 100%; width: 100%; animation-name: toast-progress; animation-timing-function: linear; animation-fill-mode: forwards; }
    .toast-progress-success { background: var(--color-primary); }
    .toast-progress-danger { background: var(--color-danger); }
    .toast-progress-info { background: var(--color-info); }
    .toast-progress-warning { background: var(--color-gold-dark); }

    @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
    @keyframes toast-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .toast-item, .toast { transition: none; animation: none; }
      .toast-progress { animation: none; transform: scaleX(0); }
    }
  `],
})
export class ToastComponent implements OnInit, OnDestroy {
  toast = inject(ToastService);
  readonly duration = TOAST_AUTO_DISMISS_MS;

  navTop = signal(20);

  private recalcNavTop = (): void => {
    const nav = document.querySelector<HTMLElement>('.topbar, .pub-header');
    const bottom = nav?.getBoundingClientRect().bottom ?? 8;
    this.navTop.set(Math.max(20, Math.round(bottom + 12)));
  };

  constructor() {
    // Toast bisa muncul kapan saja setelah interaksi user, jauh setelah
    // ngOnInit — hitung ulang tiap kali daftar toast berubah supaya posisi
    // selalu pakai posisi navbar TERKINI (mis. sudah discroll), bukan cuma
    // posisi awal saat komponen ini pertama kali mount.
    effect(() => { if (this.toast.toasts().length > 0) this.recalcNavTop(); });
  }

  ngOnInit(): void {
    this.recalcNavTop();
    window.addEventListener('scroll', this.recalcNavTop, { passive: true });
    window.addEventListener('resize', this.recalcNavTop);
  }
  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.recalcNavTop);
    window.removeEventListener('resize', this.recalcNavTop);
  }

  iconFor(type: Toast['type']): string { return ICON_BY_TYPE[type]; }
  badgeFor(type: Toast['type']): string { return BADGE_BY_TYPE[type]; }
  progressFor(type: Toast['type']): string { return PROGRESS_BY_TYPE[type]; }
  borderFor(type: Toast['type']): string { return BORDER_BY_TYPE[type]; }
  silhouetteFor(type: Toast['type']): string { return SILHOUETTE_BY_TYPE[type]; }
  titleFor(type: Toast['type']): string { return TITLE_BY_TYPE[type]; }

  onCloseClick(event: Event, id: number): void {
    event.stopPropagation();
    this.toast.dismiss(id);
  }
}
