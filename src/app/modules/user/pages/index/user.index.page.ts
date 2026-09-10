import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { UserRow } from '../../entities/user';
import { Role } from '../../../role/entities/role';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { UserFormValue, UserIndexPresenter } from './user.index.presenter';
import { UserIndexView } from './user.index.view';

const WILDCARD_TIERS = ['LDK', 'PUSKOMDA', 'PUSKOMNAS'] as const;

const emptyForm = (roleID = 0): UserFormValue => ({
  fullName: '', email: '', password: '', roleID, isActive: true, organizationID: null, wildcardTierAccess: [],
});

/** Config CmsIndexConfig<UserRow> — pemakaian ketiga CmsIndexComponent
 *  setelah Berita & Artikel, dibuat lewat factory karena target "Role"
 *  butuh loadOptions yang menunjuk ke presenter instance. Kolom "roleName"
 *  dan "isActive" sengaja dinamai sama dengan key sortColumns backend
 *  (bukan nama field UserRow "role"/"isActive" apa adanya untuk role, lihat
 *  user_service_impl.go) supaya sort=<key> langsung valid tanpa pemetaan. */
function buildUserIndexConfig(presenter: UserIndexPresenter): CmsIndexConfig<UserRow> {
  return {
    entityLabel: 'pengguna',
    guideCards: [
      { icon: 'user-plus', title: 'Tambah Pengguna', description: 'Klik <strong>"+ Tambah Pengguna"</strong> untuk membuat akun baru — isi nama, email, kata sandi, dan role.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, pilih kolom yang ingin dicari (Nama/Email/Role) — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'edit', title: 'Ubah Akun', description: 'Klik ikon pensil untuk mengubah nama, email, role, atau status akun.' },
      { icon: 'trash', title: 'Nonaktifkan & Aksi Massal', description: 'Nonaktifkan satu akun lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong>.' },
    ],
    statusOptions: [
      { value: '', label: 'Semua Status' },
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [
      { value: 'name', label: 'Nama' },
      { value: 'email', label: 'Email' },
      { value: 'role', label: 'Role', mode: 'combobox', loadOptions: () => presenter.roleOptions() },
    ],
    columns: [
      { key: 'fullName', label: 'Nama', locked: true },
      { key: 'email', label: 'Email' },
      { key: 'roleName', label: 'Role' },
      { key: 'isActive', label: 'Status' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'userID',
    emptyIcon: 'user-group',
    emptyTitle: 'Belum ada pengguna',
    emptyDescription: 'Tambahkan akun pengguna untuk mengakses CMS.',
    // Tanpa createRoute/createLabel — Tambah Pengguna membuka popup, bukan
    // navigasi, jadi tombol tambah-cepat bawaan empty-state (routerLink)
    // tidak cocok di sini. Tombol "+ Tambah Pengguna" di page-head tetap ada.
  };
}

@Component({
  selector: 'app-user-index-page',
  standalone: true,
  templateUrl: './user.index.page.html',
  imports: [FormsModule, IconComponent, ModalBackdropDirective, SelectComponent, CmsIndexComponent],
  providers: [UserIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       @if langsung mencabut elemen dari DOM begitu ditutup, jadi cuma
       transisi buka yang bisa kelihatan tanpa ini (pola sama seperti
       dropdown/date-picker/lightbox di modul lain sesi ini). Override ini
       DI-SCOPE LOKAL ke komponen ini saja (lewat Angular view encapsulation,
       bukan mengubah .modal-pop global yang dipakai 10+ modal lain) — modal
       lain tetap pakai animasi buka bawaan (.modal-pop keyframe di
       styles.scss), cuma popup Pengguna ini yang sekarang bisa animasi tutup. */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 480px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
      transition: opacity var(--motion-slow) var(--ease-out), transform var(--motion-slow) var(--ease-out);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop, .modal.modal-pop { transition: none; } }

    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    .modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-right: 8px; display: flex; flex-direction: column; gap: 18px; }
    /* Batal & Simpan berdampingan di kanan (bukan justify-between kiri-kanan)
       — sama seperti .form-actions Berita/Artikel. */
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; padding-top: 18px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    /* Header per-kelompok field di dalam modal — dipinjam dari
       form-section-label Berita, TAPI tanpa dibungkus .card lagi (modal
       sendiri sudah berperan sebagai card, membungkusnya lagi jadi
       card-di-dalam-card — sama seperti .page-shell yang meratakan
       .page-head + .card menjadi flat di cms-layout.component.ts). */
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-section-group + .form-section-group { padding-top: 18px; border-top: 1px solid var(--color-border); }
    .form-section-group .form-group:last-child { margin-bottom: 0; }
    .wildcard-tiers { display: flex; gap: 16px; flex-wrap: wrap; }
  `],
})
export class UserIndexPage implements OnInit, UserIndexView {
  private presenter = inject(UserIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  // Dipakai host untuk memanggil refresh() setelah aksi row-level (hapus/
  // hapus massal) berhasil — pola yang sama seperti onXxxSuccess->load() lama.
  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<UserRow>;

  roles = signal<Role[]>([]);
  organizationOptions = signal<SelectOption[]>([]);
  showForm = signal(false);
  saving = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  editId: number | null = null;
  // Klik baris (lihat CmsIndexComponent rowClick) membuka popup yang sama
  // dalam mode baca-saja — dibedakan lewat flag ini, bukan komponen/route
  // terpisah, sama seperti pola viewOnly di form Berita/Artikel (di sana
  // route data; di sini karena formnya popup, cukup flag lokal).
  isReadonly = false;
  form: UserFormValue = emptyForm();
  readonly wildcardTiers = WILDCARD_TIERS;

  get modalTitle(): string {
    if (this.isReadonly) return 'Detail Pengguna';
    return this.editId ? 'Ubah Pengguna' : 'Tambah Pengguna';
  }
  get modalSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail akun pengguna ini.';
    return this.editId ? 'Perbarui informasi akun pengguna ini.' : 'Isi informasi akun pengguna baru.';
  }

  readonly config = buildUserIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  roleOptions = computed(() => this.roles().map((r) => ({ value: r.roleID, label: r.roleName })));

  /** Provisioning scope UI mengikuti Section 19.5 TechSpec: LDK Admin
   *  organizationID-nya selalu dikunci server-side ke diri sendiri (field
   *  disembunyikan, tidak perlu dipilih); Puskomda memilih di antara LDK
   *  wilayahnya; Super Admin/Puskomnas Verifikator bebas memilih organisasi
   *  ATAU mencentang akses lintas-tier (wildcard). */
  callerTier = computed(() => this.auth.user()?.organizationTypeCode ?? '');
  isFreeTierCaller = computed(() => this.callerTier() === 'PUSKOMNAS' || (this.auth.user()?.wildcardTierAccess?.length ?? 0) > 0);
  showOrganizationPicker = computed(() => this.callerTier() === 'PUSKOMDA' || this.isFreeTierCaller());

  canCreate = this.auth.hasPermission('user.create');
  canUpdate = this.auth.hasPermission('user.update');
  canDelete = this.auth.hasPermission('user.delete');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadRoles();
    if (this.showOrganizationPicker()) this.presenter.loadOrganizations();
  }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = null;
    this.form = emptyForm(this.roles()[0]?.roleID ?? 0);
    this.showForm.set(true);
  }
  openEdit(u: UserRow, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = u.userID;
    this.form = {
      fullName: u.fullName, email: u.email, password: '', roleID: u.roleID, isActive: u.isActive,
      organizationID: u.organizationID ?? null, wildcardTierAccess: [...(u.wildcardTierAccess ?? [])],
    };
    this.showForm.set(true);
  }
  // Dipicu klik baris (CmsIndexComponent rowClick emit row, bukan event DOM
  // — makanya popupOrigin tidak dihitung dari titik klik seperti openCreate/
  // openEdit, cukup center seperti popupOriginFromEvent(undefined)).
  openView(u: UserRow): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.isReadonly = true;
    this.editId = u.userID;
    this.form = {
      fullName: u.fullName, email: u.email, password: '', roleID: u.roleID, isActive: u.isActive,
      organizationID: u.organizationID ?? null, wildcardTierAccess: [...(u.wildcardTierAccess ?? [])],
    };
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }

  toggleWildcardTier(tier: string): void {
    const set = new Set(this.form.wildcardTierAccess);
    if (set.has(tier)) set.delete(tier); else set.add(tier);
    this.form.wildcardTierAccess = [...set];
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  save(): void { this.presenter.save(this.editId, this.form); }
  async remove(u: UserRow, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus pengguna ${u.fullName}? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Pengguna', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(u.userID);
    this.presenter.remove(u.userID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  setRoles(roles: Role[]): void { this.roles.set(roles); }
  setOrganizationOptions(options: SelectOption[]): void { this.organizationOptions.set(options); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.showForm.set(false); this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
