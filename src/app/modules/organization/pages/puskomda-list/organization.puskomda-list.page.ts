import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { Organization } from '../../entities/organization';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { PhoneInputComponent } from '../../../../shared/phone-input.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { PuskomdaFormValue, OrganizationPuskomdaListPresenter } from './organization.puskomda-list.presenter';
import { OrganizationPuskomdaListView } from './organization.puskomda-list.view';

const emptyForm = (): PuskomdaFormValue => ({
  organizationName: '', organizationCode: '', provinceName: '', cityName: '', contactEmail: '', contactPhone: '', photoURL: '',
});

/** Config CmsIndexConfig<Organization> — kolom "isActive" (Status) WAJIB ada
 *  di sini SEKALIPUN badge-nya tampil unconditional di row template —
 *  <app-cms-index> menghasilkan jumlah <th> dari config.columns (yang
 *  visible) + satu <th>Aksi</th>; tanpa entri ini header kekurangan satu
 *  kolom dibanding body (yang selalu merender <td> Status + <td> Aksi),
 *  menggeser semua sel satu kolom ke kanan (bug yang diperbaiki di sini,
 *  sama seperti organization.ldk-list.page.ts). */
function buildPuskomdaIndexConfig(): CmsIndexConfig<Organization> {
  return {
    entityLabel: 'Puskomda',
    statusOptions: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [{ value: 'search', label: 'Nama/Kode Puskomda' }],
    columns: [
      { key: 'organizationName', label: 'Nama Puskomda', locked: true },
      { key: 'organizationCode', label: 'Kode' },
      { key: 'provinceName', label: 'Provinsi' },
      { key: 'isActive', label: 'Status' },
    ],
    defaultSort: { sortBy: 'organizationName', sortDir: 'asc' },
    rowIdKey: 'organizationID',
    emptyIcon: 'landmark',
    emptyTitle: 'Belum ada Puskomda',
    emptyDescription: 'Tambahkan Puskomda untuk mulai mengelola wilayahnya.',
  };
}

@Component({
  selector: 'app-organization-puskomda-list-page',
  standalone: true,
  templateUrl: './organization.puskomda-list.page.html',
  imports: [FormsModule, IconComponent, ModalBackdropDirective, SelectComponent, PhoneInputComponent, CmsIndexComponent],
  providers: [OrganizationPuskomdaListPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama persis seperti popup Pengguna (lihat catatan panjang di sana). */
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
       seperti popup Pengguna (lihat catatan panjang di sana). */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 480px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }
    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }

    /* Panel abu-abu + inset shadow atas-bawah menandai "area ini scroll
       tersendiri" — pola sama persis dengan .modal-body user.index.page.ts
       (Pengguna Portal Admin), diikuti tanpa mengubah warnanya. */
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
    .city-select-wrap .form-hint { margin-top: 6px; }
  `],
})
export class OrganizationPuskomdaListPage implements OnInit, OrganizationPuskomdaListView {
  private presenter = inject(OrganizationPuskomdaListPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table?: CmsIndexComponent<Organization>;
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  saving = signal(false);
  showForm = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  provinceOptions = signal<SelectOption[]>([]);
  regencyOptions = signal<SelectOption[]>([]);
  private provincesLoaded = false;
  /** Nilai id (bukan nama) yang sedang dipilih di dropdown Provinsi/Kota —
   *  murni state UI, TIDAK dipersist — lihat organization.ldk-list.page.ts
   *  untuk penjelasan lengkap pola yang sama. */
  selectedProvinceId: string | null = null;
  selectedCityId: string | null = null;
  form: PuskomdaFormValue = emptyForm();

  editId: number | null = null;
  // Klik baris (CmsIndexComponent rowClick) membuka popup yang sama dalam
  // mode baca-saja — pola sama seperti isReadonly di user.index.page.ts.
  isReadonly = false;

  canCreate = this.auth.hasPermission('organization.create');
  canUpdate = this.auth.hasPermission('organization.profile.manage');
  canDeactivate = this.auth.hasPermission('organization.deactivate');

  get modalTitle(): string {
    if (this.isReadonly) return 'Detail Puskomda';
    return this.editId ? 'Ubah Puskomda' : 'Tambah Puskomda';
  }
  get modalSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail Puskomda ini.';
    return this.editId ? 'Perbarui informasi Puskomda ini.' : 'Isi informasi Puskomda baru.';
  }

  readonly config = buildPuskomdaIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  private ensureProvincesLoaded(): void {
    if (this.provincesLoaded) return;
    this.provincesLoaded = true;
    this.presenter.loadProvinces();
  }

  private resetWilayahSelection(): void {
    this.selectedProvinceId = null;
    this.selectedCityId = null;
    this.regencyOptions.set([]);
  }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = null;
    this.form = emptyForm();
    this.resetWilayahSelection();
    this.ensureProvincesLoaded();
    this.showForm.set(true);
    this.animateModal(true);
  }
  openEdit(o: Organization, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = o.organizationID;
    this.form = {
      organizationName: o.organizationName, organizationCode: o.organizationCode,
      provinceName: o.provinceName ?? '', cityName: o.cityName ?? '',
      contactEmail: o.contactEmail ?? '', contactPhone: o.contactPhone ?? '', photoURL: o.photoURL ?? '',
    };
    this.resetWilayahSelection();
    this.ensureProvincesLoaded();
    this.showForm.set(true);
    this.animateModal(true);
  }
  // Dipicu klik baris (CmsIndexComponent rowClick emit row, bukan event DOM
  // — makanya popupOrigin tidak dihitung dari titik klik, cukup center sama
  // seperti pola openView di user.index.page.ts).
  openView(o: Organization): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.isReadonly = true;
    this.editId = o.organizationID;
    this.form = {
      organizationName: o.organizationName, organizationCode: o.organizationCode,
      provinceName: o.provinceName ?? '', cityName: o.cityName ?? '',
      contactEmail: o.contactEmail ?? '', contactPhone: o.contactPhone ?? '', photoURL: o.photoURL ?? '',
    };
    this.resetWilayahSelection();
    this.showForm.set(true);
    this.animateModal(true);
  }
  close(): void {
    this.animateModal(false);
    this.showForm.set(false);
  }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  sama persis seperti popup Pengguna (lihat catatan panjang di sana). */
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

  save(): void { this.presenter.save(this.editId, this.form); }

  onProvinceChange(v: unknown): void {
    const id = (v as string) || null;
    this.selectedProvinceId = id;
    this.selectedCityId = null;
    this.regencyOptions.set([]);
    this.form.cityName = '';
    this.form.provinceName = this.provinceOptions().find((o) => o.value === id)?.label ?? '';
    if (id) this.presenter.loadRegencies(id);
  }
  onCityChange(v: unknown): void {
    const id = (v as string) || null;
    this.selectedCityId = id;
    this.form.cityName = this.regencyOptions().find((o) => o.value === id)?.label ?? '';
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async toggleActive(o: Organization, event?: Event): Promise<void> {
    const action = o.isActive ? 'nonaktifkan' : 'aktifkan kembali';
    const ok = await this.alert.confirm(`Yakin ingin ${action} "${o.organizationName}"?`, {
      title: o.isActive ? 'Nonaktifkan Puskomda' : 'Aktifkan Kembali Puskomda', confirmLabel: 'Ya, Lanjutkan', variant: o.isActive ? 'danger' : 'default',
    }, event);
    if (!ok) return;
    this.setBusy(o.organizationID);
    if (o.isActive) this.presenter.deactivate(o.organizationID); else this.presenter.reactivate(o.organizationID);
  }

  setProvinceOptions(options: SelectOption[]): void { this.provinceOptions.set(options); }
  setRegencyOptions(options: SelectOption[]): void { this.regencyOptions.set(options); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.table?.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
