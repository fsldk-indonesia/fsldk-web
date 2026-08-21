import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Kebijakan global untuk seluruh popup/modal di aplikasi: klik pada
 * backdrop/overlay TIDAK menutup popup. Popup hanya boleh ditutup lewat
 * action close eksplisit (tombol X/Tutup/Batalkan/Close/dsb).
 *
 * Pasang di elemen backdrop, gantikan `(click)="closeFn()"` langsung:
 *   <div class="modal-backdrop" appModalBackdrop (backdropClose)="closeFn()">
 *     <div class="modal" (click)="$event.stopPropagation()"> ... </div>
 *   </div>
 *
 * `dismissible` default `false` sehingga `backdropClose` tidak pernah
 * dipancarkan dari klik backdrop — ini yang membuat perilaku "outside click
 * tidak menutup popup" jadi default global tanpa perlu diingat satu-satu di
 * setiap popup baru. Kalau suatu popup memang punya kebutuhan bisnis untuk
 * bisa ditutup lewat klik luar, set `[dismissible]="true"` secara eksplisit
 * sebagai exception yang terdokumentasi, bukan default diam-diam.
 */
@Directive({
  selector: '[appModalBackdrop]',
  standalone: true,
})
export class ModalBackdropDirective {
  @Input() dismissible = false;
  @Output() backdropClose = new EventEmitter<void>();

  @HostListener('click')
  onBackdropClick(): void {
    if (this.dismissible) this.backdropClose.emit();
  }
}
