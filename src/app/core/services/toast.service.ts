import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

/** Durasi auto-dismiss — diekspor supaya ToastComponent bisa menyamakan
 *  durasi animasi bar progres-nya persis dengan waktu dismiss sungguhan,
 *  bukan angka terpisah yang gampang tidak sinkron kalau salah satu diubah. */
export const TOAST_AUTO_DISMISS_MS = 4000;
/** Durasi transisi tutup (fade + collapse) — dipakai animasi CSS closing DI
 *  ToastComponent DAN jeda sebelum toast beneran dibuang dari `toasts()` di
 *  bawah, supaya keduanya selalu sinkron (elemen tidak dicabut dari DOM
 *  sebelum animasinya selesai). */
export const TOAST_EXIT_MS = 220;

/** Layanan notifikasi toast reusable. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  /** Toast yang sedang dalam proses menutup (transisi jalan, belum dicabut
   *  dari `toasts()`) — dibaca ToastComponent untuk toggle class `.closing`. */
  readonly closingIds = signal<ReadonlySet<number>>(new Set());
  private counter = 0;

  private push(type: Toast['type'], message: string): void {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), TOAST_AUTO_DISMISS_MS);
  }

  success(message: string): void { this.push('success', message); }
  error(message: string): void { this.push('error', message); }
  info(message: string): void { this.push('info', message); }
  warning(message: string): void { this.push('warning', message); }

  /** Menandai toast "closing" (memicu transisi tutup di ToastComponent),
   *  baru benar-benar dibuang dari `toasts()` setelah TOAST_EXIT_MS — jalur
   *  yang sama dipakai baik oleh auto-dismiss timer maupun klik manual
   *  (tombol X / klik kartu), supaya animasi tutupnya konsisten di kedua kasus. */
  dismiss(id: number): void {
    if (this.closingIds().has(id)) return;
    this.closingIds.update((s) => new Set(s).add(id));
    setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
      this.closingIds.update((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, TOAST_EXIT_MS);
  }
}
