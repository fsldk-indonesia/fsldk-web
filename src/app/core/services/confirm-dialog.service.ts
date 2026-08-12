import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button as destructive (red) styling. */
  danger?: boolean;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

/**
 * Layanan dialog konfirmasi reusable — pengganti `confirm()` bawaan browser
 * untuk aksi destruktif, dirender lewat `<app-confirm-dialog>` (dipasang
 * sekali di root aplikasi, sama seperti ToastService/<app-toast>).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly state = signal<PendingConfirm | null>(null);
  readonly current = this.state.asReadonly();

  /** Menampilkan dialog dan resolve `true`/`false` sesuai pilihan pengguna. */
  confirm(options: ConfirmOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise((resolve) => this.state.set({ options: opts, resolve }));
  }

  respond(result: boolean): void {
    const pending = this.state();
    if (!pending) return;
    this.state.set(null);
    pending.resolve(result);
  }
}
