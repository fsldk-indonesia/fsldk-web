import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { Subscriber, BulkAddResult } from '../../entities/subscriber';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { SubscriptionIndexPresenter } from './subscription.index.presenter';
import { SubscriptionIndexView } from './subscription.index.view';

/** Config CmsIndexConfig<Subscriber> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya, pola sama seperti Pesan Kontak. Tanpa createRoute/createLabel
 *  — Tambah Subscriber membuka popup, bukan navigasi, sama seperti Pengguna/
 *  QR Code (tombol "+ Tambah Subscriber" di page-head tetap ada). */
function buildSubscriptionIndexConfig(): CmsIndexConfig<Subscriber> {
  return {
    entityLabel: 'subscriber',
    guideCards: [
      { icon: 'user-plus', title: 'Tambah Subscriber', description: 'Klik <strong>"+ Tambah Subscriber"</strong> lalu masukkan satu atau lebih email sekaligus — pisahkan dengan baris baru atau koma.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari lewat email, pilih status Aktif/Nonaktif, atau atur rentang tanggal berlangganan — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat & Ubah', description: 'Klik baris mana pun untuk melihat &amp; mengubah email atau status berlangganannya.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu subscriber lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [
      { value: 'search', label: 'Email' },
    ],
    showDateRange: true,
    columns: [
      { key: 'email', label: 'Email', locked: true },
      { key: 'isActive', label: 'Status' },
      { key: 'subscribedDate', label: 'Tanggal Berlangganan' },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'subscribedDate', sortDir: 'desc' },
    rowIdKey: 'subscriberID',
    emptyIcon: 'mail',
    emptyTitle: 'Belum ada subscriber',
    emptyDescription: 'Subscriber newsletter akan muncul di sini setelah ada yang berlangganan.',
  };
}

type ViewMode = 'add' | 'edit';

@Component({
  selector: 'app-subscription-index-page',
  standalone: true,
  templateUrl: './subscription.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent],
  providers: [SubscriptionIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama persis seperti popup Pengguna/Pesan Kontak. */
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
       animateModal()), bukan CSS transition — pola & alasan sama persis
       seperti popup Pengguna/Pesan Kontak (lihat catatan panjang di sana). */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 520px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    .modal-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 18px;
      border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; padding-top: 18px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .field-card .form-section-label { margin: 0; }

    .info-box { display: flex; gap: 10px; align-items: flex-start; background: var(--color-primary-soft); color: var(--color-primary-dark); border-radius: var(--radius-xs); padding: 12px 14px; font-size: .84rem; line-height: 1.5; }
    .info-box app-icon { flex-shrink: 0; margin-top: 1px; }
    .status-toggle { display: flex; align-items: center; gap: 10px; }
    .bulk-result { display: flex; flex-direction: column; gap: 4px; font-size: .85rem; }
  `],
})
export class SubscriptionIndexPage implements OnInit, SubscriptionIndexView {
  private presenter = inject(SubscriptionIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Subscriber>;
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  busy = signal<ReadonlySet<number>>(new Set());
  showForm = signal(false);
  adding = signal(false);
  saving = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  viewMode: ViewMode = 'add';

  addEmails = '';
  editingSubscriber: Subscriber | null = null;
  editEmail = '';
  editIsActive = true;
  isReadonly = false;

  canCreate = this.auth.hasPermission('subscription.create');
  canDelete = this.auth.hasPermission('subscription.delete');

  readonly config = buildSubscriptionIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  get modalTitle(): string {
    if (this.viewMode !== 'edit') return 'Tambah Subscriber';
    return this.isReadonly ? 'Detail Subscriber' : 'Ubah Subscriber';
  }
  get modalSubtitle(): string {
    if (this.viewMode !== 'edit') return 'Masukkan satu atau lebih email sekaligus.';
    return this.isReadonly ? 'Lihat detail subscriber ini.' : 'Perbarui email atau status berlangganan subscriber ini.';
  }

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  openAdd(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.viewMode = 'add';
    this.isReadonly = false;
    this.addEmails = '';
    this.showForm.set(true);
    this.animateModal(true);
  }

  /** Dipicu klik baris (CmsIndexComponent rowClick) — buka popup yang sama
   *  dalam mode BACA-SAJA, dibedakan lewat isReadonly, bukan komponen/route
   *  terpisah, sama seperti pola viewOnly di form Berita/Pengguna. */
  openView(sub: Subscriber): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.viewMode = 'edit';
    this.isReadonly = true;
    this.editingSubscriber = sub;
    this.editEmail = sub.email;
    this.editIsActive = sub.isActive;
    this.showForm.set(true);
    this.animateModal(true);
  }

  /** Dipicu tombol pensil di kolom Aksi — sama seperti openView tapi field
   *  bisa diubah (isReadonly = false). */
  openEdit(sub: Subscriber, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.viewMode = 'edit';
    this.isReadonly = false;
    this.editingSubscriber = sub;
    this.editEmail = sub.email;
    this.editIsActive = sub.isActive;
    this.showForm.set(true);
    this.animateModal(true);
  }

  close(): void {
    if (this.adding() || this.saving()) return;
    this.animateModal(false);
    this.showForm.set(false);
  }

  submitAdd(): void {
    if (!this.addEmails.trim()) return;
    this.presenter.bulkAdd(this.addEmails);
  }

  submitEdit(): void {
    const sub = this.editingSubscriber;
    if (!sub || !this.editEmail.trim()) return;
    this.presenter.update(sub.subscriberID, this.editEmail.trim(), this.editIsActive);
  }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  sama persis seperti popup Pengguna/Pesan Kontak (lihat catatan panjang
   *  di sana). */
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

  async remove(sub: Subscriber, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus subscriber "${sub.email}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Subscriber', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(sub.subscriberID);
    this.presenter.remove(sub.subscriberID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  // SubscriptionIndexView
  setAdding(adding: boolean): void { this.adding.set(adding); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  /** Ringkasan hasil bulk-add (added/skipped/invalid) disusun & ditampilkan
   *  di sini, bukan sebagai toast generik di presenter — supaya pesan
   *  sukses/gagalnya bisa dibedakan (added:0 tetap dianggap gagal walau
   *  tidak error, mis. semua email sudah aktif atau tidak valid). */
  onBulkAddResult(result: BulkAddResult): void {
    const parts = [`${result.added} email berhasil ditambahkan`];
    if (result.skipped.length) parts.push(`${result.skipped.length} sudah aktif (dilewati)`);
    if (result.invalid.length) parts.push(`${result.invalid.length} format tidak valid (dilewati)`);
    if (result.added > 0) this.toast.success(parts.join(', ') + '.');
    else this.toast.error(parts.join(', ') + '.');
    this.close();
    this.table.refresh();
  }
  onUpdateSuccess(): void { this.editingSubscriber = null; this.close(); this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
