import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ModalBackdropDirective } from './modal-backdrop.directive';
import { IconComponent } from './icon.component';

/**
 * Popup terpusat (bukan bottom sheet) — dipakai untuk konten yang lebih pas
 * muncul sebagai kartu di tengah layar dengan transisi scale+fade, ketimbang
 * meluncur dari bawah (itu peran app-bottom-sheet). Konten diisi lewat
 * content projection, dibuka/tutup lewat `[open]` + `(closed)` — komponen
 * ini tidak menyimpan state buka/tutup sendiri, pemanggil yang memegang
 * signal-nya (pola sama seperti BottomSheetComponent/PrayerTimeComponent).
 *
 * Overlay dipindah ke document.body (pola sama dengan BottomSheetComponent)
 * supaya position:fixed-nya tidak terjebak containing block leluhur manapun
 * yang punya transform (mis. topbar .scrolled). Backdrop SENGAJA tidak
 * menutup popup — kebijakan global ModalBackdropDirective (dismissible
 * default false): hanya tombol close atau tombol Escape yang menutup.
 */
@Component({
  selector: 'app-popup-modal',
  standalone: true,
  imports: [ModalBackdropDirective, IconComponent],
  template: `
    <div class="popup-modal-backdrop" [class.active]="open" appModalBackdrop (backdropClose)="close()" #overlayEl>
      <div
        class="popup-modal-card"
        [class.active]="open"
        [class.paper]="variant === 'paper'"
        [style.max-width.px]="maxWidth"
        [style.min-height.px]="minHeight || null"
        role="dialog" aria-modal="true" [attr.aria-label]="label || null" (click)="$event.stopPropagation()"
      >
        <button type="button" class="popup-modal-close" (click)="close()" aria-label="Tutup"><app-icon name="x" [size]="15" /></button>
        <div class="popup-modal-body"><ng-content /></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .popup-modal-backdrop {
      position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center;
      background: rgba(20,23,26,.5); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-base) ease, visibility 0s linear var(--motion-base);
    }
    .popup-modal-backdrop.active {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-base) ease, visibility 0s linear 0s;
    }
    /* display:flex column — kalau [minHeight] dipakai dan kontennya lebih
       pendek dari itu, pemanggil bisa mendorong elemen ke dasar kartu (mis.
       footer lewat margin-top:auto di wrapper-nya sendiri) alih-alih
       menyisakan ruang kosong menggantung. Konten satu blok biasa (tanpa
       flex tricks) tetap terlihat sama persis seperti sebelumnya karena
       .popup-modal-body di bawah ikut jadi flex column + flex:1. */
    .popup-modal-card {
      position: relative; width: 100%; max-width: 380px; max-height: 88vh; overflow-y: auto;
      display: flex; flex-direction: column;
      background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
      opacity: 0; transform: scale(.85) translateY(14px);
      transition: opacity var(--motion-slow) var(--ease-out), transform var(--motion-slow) var(--ease-out);
    }
    .popup-modal-card.active { opacity: 1; transform: none; }
    /* Varian "paper" — kartu terlihat seperti lembar kertas surat (warna
       krem hangat, dua garis lipatan samar di 1/3 & 2/3 tinggi, sedikit
       miring alami), transisi bukanya meniru kertas yang tadinya terlipat
       rapat (scaleY sangat kecil, agak miring) lalu "dibentangkan" terbuka —
       exponential ease-out, BUKAN bounce/elastic (feel dated/tacky untuk
       kertas). Dipakai lewat [variant]="'paper'", lihat pemanggil untuk
       konteks (surat yang keluar dari amplop misi FSLDK). */
    .popup-modal-card.paper {
      background: linear-gradient(175deg, #fffdf6, #f5efdc);
      box-shadow: var(--shadow-lg), 0 0 0 1px rgba(22,33,28,.05);
      transform: scaleY(.12) scaleX(.92) rotate(-6deg);
      transform-origin: top center;
      transition: opacity var(--motion-slow) ease, transform .55s cubic-bezier(.16,1,.3,1);
    }
    .popup-modal-card.paper::before,
    .popup-modal-card.paper::after {
      content: ''; position: absolute; left: 6%; right: 6%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(22,33,28,.14), transparent);
      pointer-events: none;
    }
    .popup-modal-card.paper::before { top: 33%; }
    .popup-modal-card.paper::after { top: 66%; }
    .popup-modal-card.paper.active { transform: scale(1) rotate(-.6deg); }
    .popup-modal-close {
      position: absolute; top: 14px; right: 14px; z-index: 2; display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--color-bg-alt); color: var(--color-text-secondary);
      cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .popup-modal-close:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .popup-modal-body { padding: 30px 22px 24px; flex: 1; display: flex; flex-direction: column; }
    @media (prefers-reduced-motion: reduce) { .popup-modal-backdrop, .popup-modal-card, .popup-modal-card.paper { transition: none; } }
  `],
})
export class PopupModalComponent implements AfterViewInit, OnDestroy {
  @Input() open = false;
  @Input() label = '';
  @Input() variant: 'default' | 'paper' = 'default';
  /** Lebar maksimum kartu (px) — default 380 sama seperti sebelumnya
   *  (lihat .popup-modal-card max-width di styles). Dibuat @Input supaya
   *  konten yang lebih lebar (mis. grid filter 2 kolom) bisa minta kartu
   *  lebih lega tanpa mengubah default semua pemanggil lain. */
  @Input() maxWidth = 380;
  /** Tinggi minimum kartu (px), opsional — default tidak diset (tinggi
   *  murni ngikut konten seperti sebelumnya). Dipakai konten yang perlu
   *  terasa lega walau isinya sedikit (mis. modal filter). */
  @Input() minHeight?: number;
  @Output() closed = new EventEmitter<void>();

  // Dipindah fisik ke document.body — lihat catatan yang sama di
  // BottomSheetComponent soal kenapa ini tidak bisa lewat @if/CDK Overlay.
  @ViewChild('overlayEl', { static: true }) private overlayRef!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    document.body.appendChild(this.overlayRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.overlayRef?.nativeElement.remove();
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }
}
