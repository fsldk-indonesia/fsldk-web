import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { ModalBackdropDirective } from './modal-backdrop.directive';
import { IconComponent } from './icon.component';

/**
 * Bottom sheet global & reusable — dipakai untuk preview ringkas di mobile
 * (mis. tap kartu berita/artikel/campaign di Beranda membuka sheet berisi
 * ringkasan + tombol "Baca Selengkapnya", bukan langsung pindah halaman).
 * Konten diisi lewat content projection, dibuka/tutup lewat `[open]` +
 * `(closed)` — komponen ini tidak menyimpan state buka/tutup sendiri,
 * pemanggil yang memegang signal-nya (pola sama seperti PrayerTimeComponent).
 *
 * Overlay dipindah ke document.body (pola sama dengan PrayerTimeComponent)
 * supaya position:fixed-nya tidak terjebak containing block leluhur manapun
 * yang punya transform (mis. topbar .scrolled). Backdrop SENGAJA tidak
 * menutup sheet — kebijakan global ModalBackdropDirective (dismissible
 * default false): hanya tombol close atau swipe-down eksplisit yang menutup.
 */
@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [ModalBackdropDirective, IconComponent],
  template: `
    <div class="sheet-overlay" [class.active]="open" appModalBackdrop #overlayEl>
      <div
        class="sheet-panel"
        [class.dragging]="dragging()"
        [style.transform]="dragOffset() ? 'translateY(' + dragOffset() + 'px)' : null"
        (click)="$event.stopPropagation()"
        (touchstart)="onDragStart($event)"
        (touchmove)="onDragMove($event)"
        (touchend)="onDragEnd()"
      >
        <div class="sheet-header">
          <div class="sheet-handle"></div>
          <button type="button" class="sheet-close" (click)="close()" aria-label="Tutup">&times;</button>
        </div>
        <div class="sheet-body"><ng-content /></div>
        @if (ctaLabel) {
          <div class="sheet-footer">
            <button type="button" class="sheet-cta-btn" [style.background]="ctaAccent || null" (click)="ctaClick.emit()">
              {{ ctaLabel }} <app-icon name="chevron-right" [size]="14" />
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .sheet-overlay {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); backdrop-filter: blur(2px); z-index: 300;
      display: flex; align-items: flex-end; justify-content: center;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-base) ease, visibility var(--motion-base);
    }
    .sheet-overlay.active { opacity: 1; visibility: visible; pointer-events: auto; }
    /* display:flex column + overflow-y:auto DIPINDAH ke .sheet-body (bukan
       lagi di .sheet-panel) — supaya handle+tombol close (di luar
       .sheet-body, lihat template) tetap diam di tempat sebagai header,
       cuma konten proyeksi (foto/judul/meta/dst dari home.index.page.ts)
       yang scroll di bawahnya. Sebelumnya overflow-y ada di .sheet-panel
       sendiri, jadi handle+close ikut ke-scroll keluar layar bersama
       konten karena keduanya cuma anak biasa dari elemen yang scroll itu. */
    .sheet-panel {
      width: 100%; max-width: 520px; max-height: 88vh; background: #fff;
      border-radius: 20px 20px 0 0; box-shadow: 0 -12px 40px rgba(20,23,26,.2);
      position: relative; display: flex; flex-direction: column;
      transform: translateY(100%); transition: transform var(--motion-slow) var(--ease-out);
    }
    .sheet-overlay.active .sheet-panel { transform: translateY(0); }
    .sheet-panel.dragging { transition: none; }
    /* Header (handle+close) dibungkus terpisah supaya shadow-nya bisa
       selebar panel (bukan cuma nempel di .sheet-handle yang kecil) —
       shadow turun ke bawah, kebalikan dari .sheet-footer yang naik ke
       atas, simetris menandai batas area yang scroll di .sheet-body. */
    .sheet-header {
      flex-shrink: 0; position: relative; z-index: 1; padding-top: 14px;
      background: #fff; border-radius: 20px 20px 0 0; box-shadow: 0 8px 16px -8px rgba(20,23,26,.12);
    }
    .sheet-handle { width: 40px; height: 4px; border-radius: var(--radius-full); background: var(--color-border-strong); margin: 0 auto 12px; }
    .sheet-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0 20px 24px; }
    /* Footer TERPISAH dari .sheet-body yang scroll (di-render via @if
       ctaLabel, lihat kelas komponen) — bukan position:sticky di dalam
       .sheet-body. sticky sempat dicoba tapi cacat: karena tidak menambah
       ruang scroll ekstra, begitu konten pendek/mepet ke akhir, footer yang
       "nempel" di bawah scrollport bisa numpuk visual dengan baris terakhir
       konten (mis. excerpt) yang kebetulan discroll ke posisi yang sama.
       Elemen KELUAR dari .sheet-body sepenuhnya (pola sama seperti
       handle+close di atas) supaya tidak pernah tumpang tindih. */
    /* padding-bottom pakai env(safe-area-inset-bottom) — panel ini sengaja
       persegi di bawah (border-radius: ...0 0 di .sheet-panel, nempel rata
       ke dasar viewport), jadi di HP dengan gesture-bar/home-indicator
       (notch bawah), tanpa ini backdrop gelap bisa mengintip tipis di celah
       antara tombol dan tepi layar sungguhan. max() menjaga padding minimal
       20px tetap ada di device TANPA safe-area (env() bernilai 0 di sana). */
    .sheet-footer {
      flex-shrink: 0; padding: 12px 20px max(20px, env(safe-area-inset-bottom));
      box-shadow: 0 -8px 16px -8px rgba(20,23,26,.12); position: relative; z-index: 1; background: #fff;
    }
    /* z-index + shadow (bukan cuma bg solid) — proyeksi konten (foto preview
       dari home.index.page.ts) full-bleed ke tepi atas panel lewat margin
       negatif, jadi tombol ini sering duduk DI ATAS foto, bukan cuma di atas
       putih polos. background pucat var(--color-bg-alt) tanpa shadow nyaris
       tak kelihatan kalau area foto di baliknya kebetulan terang/putih. */
    .sheet-close {
      position: absolute; top: 12px; right: 14px; z-index: 1; width: 30px; height: 30px; border-radius: 50%;
      border: none; background: #fff; color: var(--color-text-secondary); font-size: 1.2rem; line-height: 1;
      box-shadow: 0 2px 8px rgba(20,23,26,.25);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .sheet-close:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    /* Pil gradient default (di-override per-instance lewat [ctaAccent],
       lihat home.index.page.html — 3 warna aksen bergilir untuk kartu
       artikel). */
    .sheet-cta-btn {
      display: flex; width: 100%; align-items: center; justify-content: center; gap: 8px;
      border: none; border-radius: var(--radius-full); padding: 14px 20px; color: #fff; font-weight: 700;
      background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary-dark)); box-shadow: var(--shadow-sm);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .sheet-cta-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    @media (prefers-reduced-motion: reduce) { .sheet-overlay, .sheet-panel { transition: opacity var(--motion-base) ease, visibility var(--motion-base); } .sheet-panel { transform: none !important; } }
  `],
})
export class BottomSheetComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  /** Tombol footer di-render LANGSUNG oleh komponen ini lewat @Input,
   *  BUKAN content projection (select="[sheet-footer]" sempat dicoba —
   *  konten yang diproyeksikan dari dalam blok @if pemanggil (lihat
   *  home.index.page.html) tidak konsisten terpasang ke named slot,
   *  selalu jatuh ke slot default/.sheet-body walau attribute selector-nya
   *  cocok persis). Pendekatan @Input ini sekaligus menghindari
   *  ketergantungan pada perilaku proyeksi multi-slot yang rapuh itu. */
  @Input() ctaLabel?: string;
  @Input() ctaAccent?: string;
  @Output() ctaClick = new EventEmitter<void>();

  // Kunci scroll body selama sheet terbuka — overlay position:fixed sendiri
  // tidak mencegah halaman di baliknya ikut scroll (area backdrop di luar
  // sheet-panel masih meneruskan wheel/touch-scroll ke body).
  ngOnChanges(changes: SimpleChanges): void {
    if ('open' in changes) {
      document.body.style.overflow = this.open ? 'hidden' : '';
    }
  }

  // Dipindah fisik ke document.body — lihat catatan yang sama di
  // PrayerTimeComponent soal kenapa ini tidak bisa lewat @if/CDK Overlay.
  @ViewChild('overlayEl', { static: true }) private overlayRef!: ElementRef<HTMLElement>;

  dragging = signal(false);
  dragOffset = signal(0);
  private dragStartY = 0;

  ngAfterViewInit(): void {
    document.body.appendChild(this.overlayRef.nativeElement);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.overlayRef?.nativeElement.remove();
  }

  close(): void {
    this.dragOffset.set(0);
    this.closed.emit();
  }

  onDragStart(event: TouchEvent): void {
    this.dragStartY = event.touches[0].clientY;
    this.dragging.set(true);
  }

  onDragMove(event: TouchEvent): void {
    const delta = event.touches[0].clientY - this.dragStartY;
    if (delta > 0) this.dragOffset.set(delta);
  }

  onDragEnd(): void {
    this.dragging.set(false);
    if (this.dragOffset() > 90) {
      this.close();
    } else {
      this.dragOffset.set(0);
    }
  }
}
