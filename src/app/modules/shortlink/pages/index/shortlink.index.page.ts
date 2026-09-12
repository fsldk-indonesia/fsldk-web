import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { ShortLink } from '../../entities/shortlink';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ShortlinkFormValue, ShortlinkIndexPresenter } from './shortlink.index.presenter';
import { ShortlinkIndexView } from './shortlink.index.view';

/** Config CmsIndexConfig<ShortLink> — tanpa statusOptions (bukan alur
 *  approval, lihat Permintaan Shortlink untuk itu) dan searchTargets cuma
 *  satu target gabungan karena shortlink_dto.ListFilter.Search mencocokkan
 *  shortKey ATAU destinationURL sekaligus (lihat shortlink_repository_impl.go),
 *  bukan kolom terpisah. Kolom "Tujuan" ditandai sortable:false karena
 *  destinationURL tidak ada di sortColumns backend (shortlink_service_impl.go). */
function buildShortlinkIndexConfig(): CmsIndexConfig<ShortLink> {
  return {
    entityLabel: 'shortlink',
    guideCards: [
      { icon: 'link', title: 'Buat Shortlink', description: 'Klik <strong>"+ Buat Shortlink"</strong> untuk memendekkan URL — kunci kustom bersifat opsional.' },
      { icon: 'search', title: 'Pencarian', description: 'Cari lewat kunci shortlink maupun URL tujuan di kotak pencarian atas tabel.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan, atau pakai <strong>Atur Kolom</strong> untuk sembunyikan kolom.' },
      { icon: 'edit', title: 'Ubah Shortlink', description: 'Klik ikon pensil untuk mengubah URL tujuan atau kunci shortlink kapan saja.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus lewat ikon tempat sampah, atau centang beberapa baris untuk <strong>Aksi Massal</strong>.' },
    ],
    searchTargets: [
      { value: 'search', label: 'Kunci / Tujuan' },
    ],
    showDateRange: true,
    columns: [
      { key: 'shortKey', label: 'Shortlink', locked: true },
      { key: 'destinationURL', label: 'Tujuan', sortable: false },
      { key: 'visitCount', label: 'Klik' },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'shortLinkID',
    emptyIcon: 'link',
    emptyTitle: 'Belum ada shortlink',
    emptyDescription: 'Buat tautan pendek untuk memudahkan berbagi tautan panjang.',
    // Tanpa createRoute/createLabel — Buat Shortlink membuka popup, bukan
    // navigasi (sama seperti Pengguna); tombol "+ Buat Shortlink" di
    // page-head tetap ada.
  };
}

@Component({
  selector: 'app-shortlink-index-page',
  standalone: true,
  templateUrl: './shortlink.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent],
  providers: [ShortlinkIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .key { background: var(--color-bg-alt); padding: 4px 8px; border-radius: 6px; font-size: .85rem; }
    .destination { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama seperti popup Pengguna/Role (lihat catatan panjang di sana). */
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
       animateModal()) — bukan CSS transition, sama seperti Pengguna/Role. */
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
       judul + field-nya jadi satu) kontras di atasnya, sama seperti kartu
       modul (.perm-mod) di atas .perm-list. */
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
    .view-url { display: flex; align-items: center; gap: 6px; }
    .view-url code { flex: 1 1 auto; min-width: 0; background: var(--color-bg-alt); padding: 8px 10px; border-radius: 6px; font-size: .85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .view-stats { display: flex; gap: 20px; }
    .view-stat { flex: 1 1 0; }
    .view-stat .label { font-size: .72rem; color: var(--color-text-muted); margin-bottom: 2px; }
    .view-stat .value { font-weight: 700; }
  `],
})
export class ShortlinkIndexPage implements OnInit, ShortlinkIndexView {
  private presenter = inject(ShortlinkIndexPresenter);
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<ShortLink>;
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  showForm = signal(false);
  saving = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  editId: number | null = null;
  // Baris yang sedang dilihat/diubah — dipakai popup mode-baca untuk
  // menampilkan info tambahan (shortURL, klik, dibuat) yang tidak ada di
  // ShortlinkFormValue (destinationURL/shortKey saja).
  selected: ShortLink | null = null;
  isReadonly = false;
  form: ShortlinkFormValue = { destinationURL: '', shortKey: '' };

  readonly config = buildShortlinkIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  canCreate = this.auth.hasPermission('shortlink.create');
  canUpdate = this.auth.hasPermission('shortlink.update');
  canDelete = this.auth.hasPermission('shortlink.delete');

  get modalTitle(): string {
    if (this.isReadonly) return 'Detail Shortlink';
    return this.editId ? 'Ubah Shortlink' : 'Buat Shortlink';
  }
  get modalSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail shortlink ini.';
    return this.editId ? 'Perbarui URL tujuan atau kunci shortlink ini.' : 'Pendekkan URL tujuan menjadi tautan singkat.';
  }

  ngOnInit(): void { this.presenter.attachView(this); }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = null;
    this.selected = null;
    this.form = { destinationURL: '', shortKey: '' };
    this.showForm.set(true);
    this.animateModal(true);
  }
  openEdit(s: ShortLink, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = s.shortLinkID;
    this.selected = s;
    this.form = { destinationURL: s.destinationURL, shortKey: s.shortKey };
    this.showForm.set(true);
    this.animateModal(true);
  }
  // Dipicu klik baris (CmsIndexComponent rowClick).
  openView(s: ShortLink): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.isReadonly = true;
    this.editId = s.shortLinkID;
    this.selected = s;
    this.form = { destinationURL: s.destinationURL, shortKey: s.shortKey };
    this.showForm.set(true);
    this.animateModal(true);
  }
  close(): void {
    this.animateModal(false);
    this.showForm.set(false);
  }

  /** Buka/tutup modal lewat Web Animations API — lihat catatan panjang di
   *  user.index.page.ts untuk root-cause kenapa CSS transition tidak dipakai. */
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
    if (!this.form.destinationURL) { this.toast.error('URL tujuan wajib diisi'); return; }
    this.presenter.save(this.editId, this.form);
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async remove(s: ShortLink, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus shortlink "${s.shortKey}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Shortlink', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(s.shortLinkID);
    this.presenter.remove(s.shortLinkID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  copy(url: string): void {
    navigator.clipboard.writeText(url).then(
      () => this.toast.success('Tautan disalin'),
      () => this.toast.error('Gagal menyalin tautan'),
    );
  }

  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.showForm.set(false); this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
