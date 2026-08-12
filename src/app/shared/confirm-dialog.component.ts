import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

/**
 * Modal konfirmasi reusable (dipasang sekali di root aplikasi) — gaya visual
 * sama dengan modal hand-rolled yang sudah dipakai di CMS (mis. shortlink
 * index), supaya konfirmasi aksi destruktif konsisten dengan tampilan CMS
 * dan tidak lagi memakai `confirm()` bawaan browser.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (dialog.current(); as pending) {
      <div class="modal-backdrop" (click)="respond(false)">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          @if (pending.options.title) { <h3>{{ pending.options.title }}</h3> }
          <p>{{ pending.options.message }}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-ghost btn-sm" (click)="respond(false)">{{ pending.options.cancelLabel ?? 'Batal' }}</button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-danger]="pending.options.danger"
              [class.btn-primary]="!pending.options.danger"
              (click)="respond(true)">
              {{ pending.options.confirmLabel ?? 'Ya' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 420px; }
    .confirm-modal h3 { margin: 0 0 10px; }
    .confirm-modal p { margin: 0 0 22px; color: var(--color-text-secondary); }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 10px; }
  `],
})
export class ConfirmDialogComponent {
  dialog = inject(ConfirmDialogService);
  respond(result: boolean): void { this.dialog.respond(result); }
}
