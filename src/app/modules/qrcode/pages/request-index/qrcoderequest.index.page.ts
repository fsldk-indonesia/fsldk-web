import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { QRCodeRequest } from '../../entities/qrcode-request';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { QRCodeRequestIndexPresenter } from './qrcoderequest.index.presenter';
import { QRCodeRequestIndexView } from './qrcoderequest.index.view';

/** Config CmsIndexConfig<QRCodeRequest> — antrean approval, bukan CRUD biasa
 *  (pola sama seperti Permintaan Shortlink): TANPA createRoute/createLabel
 *  (tidak ada tombol "Tambah" — request datang dari publik) dan
 *  bulkDeleteEnabled selalu false (tidak ada konsep hapus untuk permintaan). */
function buildQrcodeRequestIndexConfig(): CmsIndexConfig<QRCodeRequest> {
  return {
    entityLabel: 'permintaan QR Code',
    guideCards: [
      { icon: 'clock', title: 'Antrean Permintaan', description: 'Permintaan QR Code dari publik masuk ke sini dengan status <strong>Pending</strong>, menunggu ditinjau admin.' },
      { icon: 'check', title: 'Setujui / Tolak', description: 'Klik ikon centang untuk menyetujui — QR Code langsung aktif — atau ikon silang untuk menolak beserta alasannya.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status permintaan, atau cari berdasarkan nama pemohon maupun URL tujuan yang diajukan.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menyembunyikan kolom yang tidak perlu.' },
      { icon: 'eye', title: 'Detail Permintaan', description: 'Klik baris mana pun untuk melihat detail lengkap — kontak pemohon, kustomisasi, hingga riwayat peninjauan.' },
    ],
    statusOptions: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Disetujui' },
      { value: 'rejected', label: 'Ditolak' },
    ],
    searchTargets: [
      { value: 'search', label: 'Pemohon / Tujuan' },
    ],
    showDateRange: true,
    columns: [
      { key: 'requesterName', label: 'Pemohon', locked: true },
      { key: 'destinationURL', label: 'Tujuan', sortable: false },
      { key: 'status', label: 'Status' },
      { key: 'createdDate', label: 'Diajukan' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'qrCodeRequestID',
    emptyIcon: 'clock',
    emptyTitle: 'Belum ada permintaan',
    emptyDescription: 'Permintaan QR Code dari publik akan muncul di sini.',
  };
}

@Component({
  selector: 'app-qrcoderequest-index-page',
  standalone: true,
  templateUrl: './qrcoderequest.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent],
  providers: [QRCodeRequestIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .destination { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama seperti popup Permintaan Shortlink/Pengguna/Role. */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    /* Buka/tutup modal digerakkan lewat Web Animations API (lihat
       animateModal()) — bukan CSS transition, sama seperti modul lain. */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    .modal-close {
      position: absolute; top: 14px; right: 14px; z-index: 1; display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent; color: var(--color-muted);
      cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .modal-close:hover { background: var(--color-bg-alt); color: var(--color-text); }
    .modal { position: relative; }
    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; padding-right: 30px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    /* Container scroll modal ini SEKALIGUS panel abu-abu (background tint +
       inset shadow atas-bawah) — pola sama persis seperti .perm-list di
       popup Role Pengguna: tint & shadow menandai "area ini scroll
       tersendiri", tiap section (dibungkus SATU card putih .field-card,
       judul + field-nya jadi satu) kontras di atasnya. Dipakai popup Tolak
       DAN Detail (keduanya berbagi class .modal-body yang sama). */
    .modal-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 16px;
      border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; padding-top: 18px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    /* SATU card putih per section (judul + semua field-nya jadi satu) —
       gaya sama seperti .perm-mod (kartu modul) di popup Role Pengguna. */
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }

    /* Detail view (baca-saja) — pasangan label/nilai, bukan <input> disabled,
       karena popup ini murni informasional (tidak ada aksi edit di sini). */
    .view-row { display: flex; flex-direction: column; gap: 2px; }
    .view-row .label { font-size: .72rem; font-weight: 700; color: var(--color-text-muted); }
    .view-row .value { font-weight: 400; color: var(--color-text); word-break: break-word; }
    .qr-preview { display: flex; justify-content: center; padding: 8px 0; }
    .qr-preview img { width: 160px; height: 160px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; object-fit: contain; }
    .view-actions { display: flex; justify-content: center; }
  `],
})
export class QRCodeRequestIndexPage implements OnInit, QRCodeRequestIndexView {
  private presenter = inject(QRCodeRequestIndexPresenter);
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<QRCodeRequest>;

  busy = signal<ReadonlySet<number>>(new Set());

  // --- Popup Tolak Permintaan ---
  showReject = signal(false);
  rejectSaving = signal(false);
  rejectPopupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  @ViewChild('rejectModalEl') private rejectModalEl?: ElementRef<HTMLElement>;
  private rejectAnimation: Animation | null = null;
  rejectTarget: QRCodeRequest | null = null;
  rejectReason = '';

  // --- Popup Detail Permintaan (dipicu klik baris) ---
  showView = signal(false);
  viewPopupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  @ViewChild('viewModalEl') private viewModalEl?: ElementRef<HTMLElement>;
  private viewAnimation: Animation | null = null;
  viewTarget: QRCodeRequest | null = null;

  readonly config = buildQrcodeRequestIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  canApprove = this.auth.hasPermission('qrcode.approve');

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async approve(r: QRCodeRequest, event?: Event): Promise<void> {
    event?.stopPropagation();
    const ok = await this.alert.confirm(`Setujui permintaan dari "${r.requesterName}"? QR Code akan langsung aktif.`, {
      title: 'Setujui Permintaan', confirmLabel: 'Ya, Setujui',
    }, event);
    if (!ok) return;
    this.setBusy(r.qrCodeRequestID);
    this.presenter.approve(r.qrCodeRequestID);
  }

  openReject(r: QRCodeRequest, event?: Event): void {
    event?.stopPropagation();
    this.rejectPopupOrigin.set(popupOriginFromEvent(event));
    this.rejectTarget = r;
    this.rejectReason = '';
    this.showReject.set(true);
    this.animateModal(this.rejectModalEl, 'reject', true);
  }
  closeReject(): void {
    this.animateModal(this.rejectModalEl, 'reject', false);
    this.showReject.set(false);
  }
  submitReject(): void {
    if (!this.rejectTarget || !this.rejectReason.trim()) return;
    this.presenter.reject(this.rejectTarget.qrCodeRequestID, this.rejectReason.trim());
  }

  // Dipicu klik baris (CmsIndexComponent rowClick) — popup detail baca-saja,
  // TIDAK menimpa alur Setujui/Tolak (tombol aksi tetap stopPropagation).
  openView(r: QRCodeRequest): void {
    this.viewPopupOrigin.set(popupOriginFromEvent());
    this.viewTarget = r;
    this.showView.set(true);
    this.animateModal(this.viewModalEl, 'view', true);
  }
  closeView(): void {
    this.animateModal(this.viewModalEl, 'view', false);
    this.showView.set(false);
  }

  /** Buka/tutup modal lewat Web Animations API — lihat catatan panjang di
   *  user.index.page.ts untuk root-cause kenapa CSS transition tidak dipakai.
   *  Dipakai dua popup independen (Tolak & Detail) lewat parameter `which`
   *  supaya masing-masing punya state Animation sendiri, tidak saling
   *  meng-cancel animasi popup lain. */
  private animateModal(elRef: ElementRef<HTMLElement> | undefined, which: 'reject' | 'view', opening: boolean): void {
    const el = elRef?.nativeElement;
    if (!el) return;
    const current = which === 'reject' ? this.rejectAnimation : this.viewAnimation;
    current?.cancel();
    const { dx, dy } = which === 'reject' ? this.rejectPopupOrigin() : this.viewPopupOrigin();
    const closed: Keyframe = { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.25)` };
    const open: Keyframe = { opacity: 1, transform: 'none' };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const anim = el.animate(opening ? [closed, open] : [open, closed], {
      duration: reduceMotion ? 1 : 250,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'forwards',
    });
    if (which === 'reject') this.rejectAnimation = anim; else this.viewAnimation = anim;
    anim.onfinish = () => {
      anim.cancel();
      if (which === 'reject' && this.rejectAnimation === anim) this.rejectAnimation = null;
      if (which === 'view' && this.viewAnimation === anim) this.viewAnimation = null;
    };
  }

  statusLabel(status: string): string {
    return status === 'pending' ? 'Pending' : status === 'approved' ? 'Disetujui' : 'Ditolak';
  }

  download(r: QRCodeRequest): void {
    if (!r.imageURL) return;
    const a = document.createElement('a');
    a.href = r.imageURL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  }

  onActionSettled(id: number): void { this.clearBusy(id); }
  onApproveSuccess(): void { this.table.refresh(); }
  setRejectSaving(saving: boolean): void { this.rejectSaving.set(saving); }
  onRejectSuccess(): void { this.closeReject(); this.table.refresh(); }
}
