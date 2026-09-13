import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { QRCode } from '../../entities/qrcode';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import {
  QrcodeStyleEditorComponent, QrcodeStyleValue, defaultQrcodeStyle,
} from '../../components/qrcode-style-editor/qrcode-style-editor.component';
import { QrcodeIndexPresenter } from './qrcode.index.presenter';
import { QrcodeIndexView } from './qrcode.index.view';

interface QrcodeFormValue { destinationURL: string; label: string }

/** Config CmsIndexConfig<QRCode> — pola sama seperti Shortlink: tanpa
 *  statusOptions (bukan alur approval, lihat Permintaan QR Code untuk itu),
 *  searchTargets satu target gabungan karena qrcode_dto.ListFilter.Search
 *  mencocokkan label/destinationURL/captionText sekaligus (lihat
 *  qrcode_repository_impl.go). Kolom "Tujuan" sortable:false karena
 *  destinationURL tidak ada di sortColumns backend (qrcode_service_impl.go). */
function buildQrcodeIndexConfig(): CmsIndexConfig<QRCode> {
  return {
    entityLabel: 'QR Code',
    guideCards: [
      { icon: 'qr-code', title: 'Buat QR Code', description: 'Klik <strong>"+ Buat QR Code"</strong> untuk membuat kode QR baru — warna, ikon tengah, dan teks bisa dikustomisasi.' },
      { icon: 'search', title: 'Pencarian', description: 'Cari lewat label, URL tujuan, maupun teks caption di kotak pencarian atas tabel.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan, atau pakai <strong>Atur Kolom</strong> untuk sembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat & Ubah', description: 'Klik baris mana pun untuk melihat &amp; mengunduh gambarnya, atau ikon pensil untuk mengubah.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus lewat ikon tempat sampah, atau centang beberapa baris untuk <strong>Aksi Massal</strong>.' },
    ],
    searchTargets: [
      { value: 'search', label: 'Label / Tujuan / Caption' },
    ],
    showDateRange: true,
    columns: [
      { key: 'qrThumb', label: 'QR', sortable: false },
      { key: 'label', label: 'Label' },
      { key: 'destinationURL', label: 'Tujuan', sortable: false },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'qrCodeID',
    emptyIcon: 'qr-code',
    emptyTitle: 'Belum ada QR Code',
    emptyDescription: 'Buat kode QR untuk membagikan tautan lewat pindaian kamera.',
    // Tanpa createRoute/createLabel — Buat QR Code membuka popup, bukan
    // navigasi (sama seperti Shortlink); tombol "+ Buat QR Code" di
    // page-head tetap ada.
  };
}

@Component({
  selector: 'app-qrcode-index-page',
  standalone: true,
  templateUrl: './qrcode.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent, QrcodeStyleEditorComponent],
  providers: [QrcodeIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .qr-thumb { width: 40px; height: 40px; border-radius: 6px; border: 1px solid var(--color-border); background: #fff; display: block; object-fit: contain; }
    .destination { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama seperti popup Shortlink/Pengguna/Role. */
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
       animateModal()) — bukan CSS transition, sama seperti Shortlink. */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 640px; max-height: 90vh; display: flex; flex-direction: column;
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
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .view-stats { display: flex; gap: 20px; }
    .view-stat { flex: 1 1 0; }
    .view-stat .label { font-size: .72rem; color: var(--color-text-muted); margin-bottom: 2px; }
    .view-stat .value { font-weight: 700; }
    .qr-preview { display: flex; justify-content: center; padding: 12px 0; }
    .qr-preview img { width: 200px; height: 200px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; object-fit: contain; }
    .view-actions { display: flex; justify-content: center; }

    .size-picker .form-label { display: block; margin-bottom: 8px; }
    .size-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .size-opt {
      padding: 7px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-full);
      background: var(--color-bg-warm); color: var(--color-text-secondary); font-size: .82rem; font-weight: 700;
      cursor: pointer; transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .size-opt:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .size-opt.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .size-input {
      width: 90px; flex-shrink: 0; padding: 6px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-full);
      font-family: var(--font-body); font-size: .85rem; color: var(--color-text); text-align: center;
      -moz-appearance: textfield;
    }
    .size-input::-webkit-outer-spin-button, .size-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .size-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .size-hint { font-size: .78rem; color: var(--color-muted); margin: 8px 0 0; }
  `],
})
export class QrcodeIndexPage implements OnInit, QrcodeIndexView {
  private presenter = inject(QrcodeIndexPresenter);
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<QRCode>;
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  showForm = signal(false);
  saving = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  editId: number | null = null;
  // Baris yang sedang dilihat/diubah — dipakai popup mode-baca untuk
  // menampilkan info tambahan (gambar QR, pembuat, dibuat) yang tidak ada
  // di QrcodeFormValue (destinationURL/label saja).
  selected: QRCode | null = null;
  isReadonly = false;
  form: QrcodeFormValue = { destinationURL: '', label: '' };
  style: QrcodeStyleValue = defaultQrcodeStyle();

  /** Ukuran unduhan PNG di popup Detail — dibatasi sama dengan clamp backend,
   *  sama seperti size-picker halaman publik (qrcode.detail.page.ts). */
  readonly minSize = 128;
  readonly maxSize = 1024;
  readonly presetSizes = [256, 512, 1024];
  size = signal(1024);

  readonly config = buildQrcodeIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  canCreate = this.auth.hasPermission('qrcode.create');
  canUpdate = this.auth.hasPermission('qrcode.update');
  canDelete = this.auth.hasPermission('qrcode.delete');

  get modalTitle(): string {
    if (this.isReadonly) return 'Detail QR Code';
    return this.editId ? 'Ubah QR Code' : 'Buat QR Code';
  }
  get modalSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail dan unduh gambar QR Code ini.';
    return this.editId ? 'Perbarui tujuan atau tampilan QR Code ini.' : 'Buat kode QR yang mengarah langsung ke tautan tujuan.';
  }

  ngOnInit(): void { this.presenter.attachView(this); }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = null;
    this.selected = null;
    this.form = { destinationURL: '', label: '' };
    this.style = defaultQrcodeStyle();
    this.showForm.set(true);
    this.animateModal(true);
  }
  openEdit(q: QRCode, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = q.qrCodeID;
    this.selected = q;
    this.form = { destinationURL: q.destinationURL, label: q.label };
    this.style = {
      foregroundColor: q.foregroundColor || defaultQrcodeStyle().foregroundColor,
      backgroundColor: q.backgroundColor || defaultQrcodeStyle().backgroundColor,
      centerIconURL: q.centerIconURL,
      centerIconKey: q.centerIconKey,
      captionText: q.captionText,
    };
    this.showForm.set(true);
    this.animateModal(true);
  }
  // Dipicu klik baris (CmsIndexComponent rowClick).
  openView(q: QRCode): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.isReadonly = true;
    this.editId = q.qrCodeID;
    this.selected = q;
    this.form = { destinationURL: q.destinationURL, label: q.label };
    this.size.set(this.maxSize);
    this.showForm.set(true);
    this.animateModal(true);
  }
  close(): void {
    this.animateModal(false);
    this.showForm.set(false);
  }

  /** Buka/tutup modal lewat Web Animations API — lihat catatan panjang di
   *  shortlink.index.page.ts / user.index.page.ts untuk root-cause kenapa
   *  CSS transition tidak dipakai. */
  private animateModal(opening: boolean): void {
    const el = this.modalEl?.nativeElement;
    if (!el) return;
    this.modalAnimation?.cancel();
    const { dx, dy } = this.popupOrigin();
    const closed: Keyframe = { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.25)` };
    const open: Keyframe = { opacity: 1, transform: 'none' };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const anim = el.animate(opening ? [closed, open] : [open, closed], {
      duration: reduceMotion ? 1 : 250,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'forwards',
    });
    this.modalAnimation = anim;
    anim.onfinish = () => {
      anim.cancel();
      if (this.modalAnimation === anim) this.modalAnimation = null;
    };
  }

  save(): void {
    if (!this.form.destinationURL.trim()) { this.toast.error('URL tujuan wajib diisi'); return; }
    this.presenter.save(this.editId, { ...this.form, ...this.style });
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async remove(q: QRCode, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus QR Code "${q.label || q.destinationURL}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus QR Code', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(q.qrCodeID);
    this.presenter.remove(q.qrCodeID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  setSize(value: number | string): void {
    let n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    n = Math.min(this.maxSize, Math.max(this.minSize, n));
    this.size.set(n);
  }

  /** Unduhan cepat dari ikon baris tabel — selalu ukuran maksimum, tanpa
   *  pilihan (size-picker cuma ada di popup Detail, lihat template). */
  download(q: QRCode): void { this.presenter.download(q.qrCodeID, this.maxSize); }
  downloadSelected(): void { if (this.selected) this.presenter.download(this.selected.qrCodeID, this.size()); }

  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
  saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
