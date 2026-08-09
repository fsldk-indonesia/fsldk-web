import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

/** Kontainer notifikasi toast reusable (dipasang di root aplikasi). */
@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.toast-success]="t.type === 'success'"
             [class.toast-error]="t.type === 'error'" [class.toast-info]="t.type === 'info'"
             [class.toast-warning]="t.type === 'warning'"
             (click)="toast.dismiss(t.id)">
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
    .toast {
      padding: 14px 18px; border-radius: var(--radius, 13px); color: #fff; font-family: var(--font-body, inherit);
      font-weight: 600; font-size: .9rem; box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,.18)); cursor: pointer;
      animation: slidein var(--motion-base, 200ms) var(--ease-out, ease);
    }
    .toast-success { background: var(--color-primary, #00933b); }
    .toast-error { background: var(--color-danger, #d93a3a); }
    .toast-info { background: var(--color-info, #3573a6); }
    .toast-warning { background: var(--color-warning, #b8790a); }
    @keyframes slidein { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);
}
