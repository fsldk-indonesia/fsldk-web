import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { AlertService, ConfirmRequest } from '../core/services/alert.service';
import { IconComponent } from './icon.component';
import { ModalBackdropDirective } from './modal-backdrop.directive';

/** Dialog konfirmasi reusable (dipasang di root aplikasi, sejajar app-toast)
 *  — pengganti bergaya untuk `confirm()` bawaan browser. Kartu polos + badge
 *  ikon bulat mengambang di atas judul/deskripsi (bukan lagi panel header
 *  bergradasi dengan motif jaringan+batik Kawung — dihapus, badge ikonnya
 *  sekarang memakai kelas icon-badge yang sama dipakai di seluruh app,
 *  bukan gaya bespoke satu-off).
 *
 * Backdrop & kartu SELALU di-render (bukan @if (alert.request())) supaya
 * transisi TUTUP kelihatan — sama pola dengan popup Pengguna/dropdown di
 * modul lain sesi ini. `lastRequest` menyimpan data permintaan terakhir
 * secara terpisah dari `alert.request()` (yang langsung jadi null begitu
 * resolve() dipanggil) supaya judul/pesan/tombol tetap kebaca selama
 * animasi fade-out berjalan, bukan mendadak kosong.
 */
@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [IconComponent, ModalBackdropDirective],
  template: `
    <div class="alert-backdrop" [class.open]="visible()" appModalBackdrop (backdropClose)="cancel()">
      @if (lastRequest(); as req) {
        <div class="alert-card modal-pop" [class.open]="visible()" role="alertdialog" aria-modal="true"
             [style.--dx.px]="req.origin.dx" [style.--dy.px]="req.origin.dy"
             [attr.aria-label]="req.title" (click)="$event.stopPropagation()">
          <button type="button" class="alert-close" (click)="cancel()" aria-label="Tutup"><app-icon name="x" [size]="14" /></button>

          <div class="alert-body">
            <span class="icon-badge lg" [class]="'icon-badge lg ' + (req.variant === 'danger' ? 'icon-badge-danger' : 'icon-badge-soft')">
              <app-icon [name]="req.variant === 'danger' ? 'trash' : 'help-circle'" [size]="24" />
            </span>
            <h3>{{ req.title }}</h3>
            <p>{{ req.message }}</p>
          </div>

          <div class="alert-actions">
            <button type="button" class="btn btn-outline" (click)="cancel()">{{ req.cancelLabel }}</button>
            <button type="button" class="btn" [class.btn-danger]="req.variant === 'danger'"
                    [class.btn-primary]="req.variant !== 'danger'" (click)="confirm()">{{ req.confirmLabel }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .alert-backdrop {
      position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center;
      background: rgba(11, 20, 15, .5); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-base) ease, visibility 0s linear var(--motion-base);
    }
    .alert-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-base) ease, visibility 0s linear 0s;
    }
    @media (prefers-reduced-motion: reduce) { .alert-backdrop { transition: none; } }

    /* Override .modal-pop global (animation keyframe, cuma bisa animasi
       buka) jadi transition-based buka/tutup — DI-SCOPE LOKAL ke komponen
       ini lewat Angular view encapsulation, sama seperti popup Pengguna,
       tidak mengubah .modal-pop global yang dipakai 10+ popup lain. */
    .alert-card.modal-pop {
      position: relative; width: 100%; max-width: 380px; background: #fff; border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
      transition: opacity var(--motion-slow) var(--ease-out), transform var(--motion-slow) var(--ease-out);
    }
    .alert-card.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .alert-card.modal-pop { transition: none; } }

    .alert-close {
      position: absolute; top: 14px; right: 14px; display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent; color: var(--color-muted);
      cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .alert-close:hover { background: var(--color-bg-alt); color: var(--color-text); }

    .alert-body { display: flex; flex-direction: column; align-items: center; padding: 34px 26px 4px; text-align: center; }
    .alert-body .icon-badge { margin-bottom: 16px; }
    .alert-body h3 { margin: 0 0 8px; font-size: 1.1rem; }
    .alert-body p { margin: 0; color: var(--color-text-secondary); font-size: .92rem; line-height: 1.55; }

    .alert-actions { display: flex; gap: 10px; padding: 22px 26px 26px; }
    .alert-actions .btn { flex: 1; }
  `],
})
export class AlertDialogComponent {
  alert = inject(AlertService);

  visible = signal(false);
  lastRequest = signal<ConfirmRequest | null>(null);

  constructor() {
    effect(() => {
      const req = this.alert.request();
      if (req) this.lastRequest.set(req);
      this.visible.set(!!req);
    });
  }

  confirm(): void { this.alert.resolve(true); }
  cancel(): void { this.alert.resolve(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.alert.request()) this.cancel();
  }
}
