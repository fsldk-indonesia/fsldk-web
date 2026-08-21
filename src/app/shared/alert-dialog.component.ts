import { Component, HostListener, inject } from '@angular/core';
import { AlertService } from '../core/services/alert.service';
import { IconComponent } from './icon.component';
import { ModalBackdropDirective } from './modal-backdrop.directive';

/** Dialog konfirmasi reusable (dipasang di root aplikasi, sejajar app-toast)
 *  — pengganti bergaya untuk `confirm()` bawaan browser. Motif visualnya
 *  sengaja memakai bahasa yang sama dengan seluruh situs (simpul jaringan
 *  berdenyut + tekstur batik Kawung), bukan ikon generik lepas, supaya
 *  terasa satu identitas walau ini komponen sistem/utilitas. */
@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [IconComponent, ModalBackdropDirective],
  template: `
    @if (alert.request(); as req) {
      <div class="alert-backdrop" appModalBackdrop (backdropClose)="cancel()">
        <div class="alert-card modal-pop" [class.danger]="req.variant === 'danger'" role="alertdialog" aria-modal="true"
             [style.--dx.px]="req.origin.dx" [style.--dy.px]="req.origin.dy"
             [attr.aria-label]="req.title" (click)="$event.stopPropagation()">
          <div class="alert-header pattern-motif pattern-motif-light">
            <svg class="alert-glyph" width="30" height="22" viewBox="0 0 30 22" aria-hidden="true">
              <path class="network-line" d="M15,11 L4,4 M15,11 L4,18 M15,11 L26,4 M15,11 L26,18" />
              <circle class="network-node" cx="15" cy="11" r="3.4" />
              <circle class="network-node" cx="4" cy="4" r="2" style="animation-delay:.3s" />
              <circle class="network-node ember" cx="4" cy="18" r="2" style="animation-delay:.6s" />
              <circle class="network-node" cx="26" cy="4" r="2" style="animation-delay:.9s" />
              <circle class="network-node ember" cx="26" cy="18" r="2" style="animation-delay:1.2s" />
            </svg>
            <span class="alert-icon-badge">
              <app-icon [name]="req.variant === 'danger' ? 'trash' : 'help-circle'" [size]="22" />
            </span>
          </div>

          <div class="alert-body">
            <h3>{{ req.title }}</h3>
            <p>{{ req.message }}</p>
          </div>

          <div class="alert-actions">
            <button type="button" class="btn btn-outline" (click)="cancel()">{{ req.cancelLabel }}</button>
            <button type="button" class="btn" [class.btn-danger]="req.variant === 'danger'"
                    [class.btn-primary]="req.variant !== 'danger'" (click)="confirm()">{{ req.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .alert-backdrop {
      position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center;
      background: rgba(11, 20, 15, .5); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      padding: 20px; animation: alert-backdrop-in var(--motion-base) ease both;
    }
    @keyframes alert-backdrop-in { from { opacity: 0; } to { opacity: 1; } }

    .alert-card {
      width: 100%; max-width: 380px; background: #fff; border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); overflow: hidden;
    }
    @media (prefers-reduced-motion: reduce) { .alert-backdrop { animation: none; } }

    .alert-header {
      position: relative; display: flex; justify-content: center; padding: 28px 0 34px;
      background: linear-gradient(135deg, var(--color-primary-tint), var(--color-primary-soft));
    }
    .alert-card.danger .alert-header { background: linear-gradient(135deg, #fff, var(--color-danger-soft)); }
    .alert-glyph { position: absolute; top: 10px; right: 14px; opacity: .8; }
    .alert-icon-badge {
      width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(150deg, #fff, var(--color-primary-soft)); color: var(--color-primary-dark);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.6), var(--shadow);
    }
    .alert-card.danger .alert-icon-badge { background: linear-gradient(150deg, #fff, var(--color-danger-soft)); color: var(--color-danger); }

    .alert-body { padding: 22px 26px 4px; text-align: center; }
    .alert-body h3 { margin: 0 0 8px; font-size: 1.1rem; }
    .alert-body p { margin: 0; color: var(--color-text-secondary); font-size: .92rem; line-height: 1.55; }

    .alert-actions { display: flex; gap: 10px; padding: 22px 26px 26px; }
    .alert-actions .btn { flex: 1; }
  `],
})
export class AlertDialogComponent {
  alert = inject(AlertService);

  confirm(): void { this.alert.resolve(true); }
  cancel(): void { this.alert.resolve(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.alert.request()) this.cancel();
  }
}
