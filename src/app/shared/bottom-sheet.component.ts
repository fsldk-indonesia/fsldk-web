import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { ModalBackdropDirective } from './modal-backdrop.directive';

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
  imports: [ModalBackdropDirective],
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
        <div class="sheet-handle"></div>
        <button type="button" class="sheet-close" (click)="close()" aria-label="Tutup">&times;</button>
        <div class="sheet-body"><ng-content /></div>
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
    .sheet-panel {
      width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; background: #fff;
      border-radius: 20px 20px 0 0; box-shadow: 0 -12px 40px rgba(20,23,26,.2);
      padding: 14px 20px 24px; position: relative;
      transform: translateY(100%); transition: transform var(--motion-slow) var(--ease-out);
    }
    .sheet-overlay.active .sheet-panel { transform: translateY(0); }
    .sheet-panel.dragging { transition: none; }
    .sheet-handle { width: 40px; height: 4px; border-radius: var(--radius-full); background: var(--color-border-strong); margin: 0 auto 12px; }
    .sheet-close {
      position: absolute; top: 12px; right: 14px; width: 30px; height: 30px; border-radius: 50%;
      border: none; background: var(--color-bg-alt); color: var(--color-text-secondary); font-size: 1.2rem; line-height: 1;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .sheet-close:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    @media (prefers-reduced-motion: reduce) { .sheet-overlay, .sheet-panel { transition: opacity var(--motion-base) ease, visibility var(--motion-base); } .sheet-panel { transform: none !important; } }
  `],
})
export class BottomSheetComponent implements AfterViewInit, OnDestroy {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

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
