import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../core/services/toast.service';
import { IconComponent } from './icon.component';

const ICON_BY_TYPE: Record<Toast['type'], string> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info-circle',
  warning: 'alert-triangle',
};

/** Kontainer notifikasi toast reusable (dipasang di root aplikasi). Background
 *  solid per jenis (bukan lagi kartu putih + garis aksen di pinggir — itu
 *  "tell" desain AI yang klise, dihapus atas permintaan langsung) dengan
 *  ikon dalam badge putih bulat supaya tetap kontras di atas warna solid.
 *  Palet dibatasi hijau (berhasil) / merah (gagal, termasuk warning) / biru
 *  (info) — tanpa aksen kuning/emas. */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="toast-stack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast-' + t.type" (click)="toast.dismiss(t.id)">
          <span class="toast-icon"><app-icon [name]="iconFor(t.type)" [size]="16" /></span>
          <p class="toast-msg">{{ t.message }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack { position: fixed; top: 20px; right: 20px; z-index: 210; display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
    .toast {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 18px 12px 12px; border-radius: var(--radius-full, 999px); color: #fff;
      box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,.18));
      cursor: pointer;
      animation: toast-in var(--motion-slow, 250ms) var(--ease-out, ease);
    }
    .toast-icon {
      flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%; background: #fff;
    }
    .toast-msg { margin: 0; font-family: var(--font-body, inherit); font-weight: 700; font-size: .9rem; line-height: 1.4; }

    .toast-success { background: var(--color-primary); }
    .toast-success .toast-icon { color: var(--color-primary); }
    .toast-error, .toast-warning { background: var(--color-danger); }
    .toast-error .toast-icon, .toast-warning .toast-icon { color: var(--color-danger); }
    .toast-info { background: var(--color-info); }
    .toast-info .toast-icon { color: var(--color-info); }

    @keyframes toast-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);

  iconFor(type: Toast['type']): string { return ICON_BY_TYPE[type]; }
}
