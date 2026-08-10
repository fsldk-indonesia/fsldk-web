import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'default' | 'danger';
}

/** Layanan dialog konfirmasi reusable — pengganti `confirm()` bawaan browser
 *  yang tidak bisa diberi gaya. `confirm()` mengembalikan Promise<boolean>
 *  supaya pemanggilnya tetap bisa memakai pola `if (!(await ...)) return;`
 *  yang sama seperti `confirm()` native. */
@Injectable({ providedIn: 'root' })
export class AlertService {
  readonly request = signal<ConfirmRequest | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  confirm(
    message: string,
    opts?: Partial<Pick<ConfirmRequest, 'title' | 'confirmLabel' | 'cancelLabel' | 'variant'>>,
  ): Promise<boolean> {
    this.request.set({
      title: opts?.title ?? 'Konfirmasi',
      message,
      confirmLabel: opts?.confirmLabel ?? 'Ya, Lanjutkan',
      cancelLabel: opts?.cancelLabel ?? 'Batal',
      variant: opts?.variant ?? 'default',
    });
    return new Promise<boolean>((resolve) => { this.resolver = resolve; });
  }

  resolve(value: boolean): void {
    this.request.set(null);
    this.resolver?.(value);
    this.resolver = null;
  }
}
