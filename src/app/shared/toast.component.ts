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
             (click)="toast.dismiss(t.id)">
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
    .toast { padding: 14px 18px; border-radius: 10px; color: #fff; font-weight: 600; font-size: .9rem; box-shadow: 0 10px 30px rgba(0,0,0,.18); cursor: pointer; animation: slidein .2s ease; }
    .toast-success { background: #00933b; }
    .toast-error { background: #e62129; }
    .toast-info { background: #14171a; }
    @keyframes slidein { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);
}
