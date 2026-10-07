import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
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
    // Tanpa opsi sentinel "Semua Status" — MultiSelectComponent menampilkan
    // placeholder itu otomatis saat tidak ada yang dicentang.
    statusOptions: [
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
    /* Buka/tutup modal ini DIGERAKKAN LEWAT JS (Web Animations API, lihat
       animateModal()) — bukan CSS transition/animation. CSS di sini cuma
       merepresentasikan dua state STATIS (tertutup di keadaan diam, terbuka
       di keadaan diam) yang dipakai SEBELUM animasi pertama & SESUDAH
       animasi selesai (animation.cancel() melepas animasinya, baliknya ke
       aturan CSS biasa ini). Alasan pindah dari transition ke WAAPI: dengan
       transition, transisi BUKA memakai transform elemen ter-paint
       TERAKHIR sebagai titik awal — kalau origin (--dx/--dy) baru saja
       diganti sambil modal masih tertutup, titik awal itu masih posisi
       origin LAMA (percobaan 2x sebelumnya sama-sama gagal karena akar
       masalah ini: rAF & flag transition:none tidak cukup, transisi CSS
       tetap "mengingat" state ter-paint sebelumnya). WAAPI tidak punya
       masalah ini — dx/dy dioper LANGSUNG sebagai nilai JS ke .animate(),
       tidak lewat custom property yang bisa "nyangkut" transisi lain. */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 480px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    /* Container scroll modal ini SEKALIGUS panel abu-abu (background tint +
       inset shadow atas-bawah) — pola sama persis seperti .perm-list di
       popup Role Pengguna: tint & shadow menandai "area ini scroll
       tersendiri", field tiap section (dibungkus .field-card putih)
       kontras di atasnya, sama seperti kartu modul (.perm-mod) di atas
       .perm-list. */
    .modal-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 18px;
      border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
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
    /* Segmented control (bukan 3 kotak centang lepas) — tier bersifat
       hierarkis-kumulatif (centang Puskomnas ikut mencentang Puskomda & LDK,
       lihat toggleWildcardTier()), jadi tampilannya SENGAJA dibuat
       "menyambung" satu baris supaya terlihat sebagai satu skala satu sama
       lain, bukan 3 pilihan independen. Checkbox asli disembunyikan off-screen
       (pola sama seperti .switch input di styles.scss) — status terpilih
       cukup lewat highlight background, highlight BERURUTAN tanpa jeda dari
       tier terpilih ke bawah juga ikut menegaskan hubungan kumulatifnya. */
    .wildcard-tiers { display: flex; border: 1px solid var(--color-border); border-radius: var(--radius-xs); overflow: hidden; }
    .wildcard-tiers .form-check {
      flex: 1 1 0; justify-content: center; gap: 0; border: none; border-radius: 0;
      background: #fff; padding: 11px 10px; font-size: .82rem;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .wildcard-tiers .form-check:not(:last-child) { border-right: 1px solid var(--color-border); }
    .wildcard-tiers .form-check input[type="checkbox"] {
      position: absolute; width: 1px; height: 1px; opacity: 0; margin: 0; pointer-events: none;
    }
    .wildcard-tiers .form-check:has(input:checked) { background: var(--color-primary-soft); color: var(--color-primary-dark); }

    /* SATU card putih per section (judul + semua field-nya jadi satu) —
       gaya sama seperti .perm-mod (kartu modul) di popup Role Pengguna,
       kontras di atas .modal-body yang abu-abu. */
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .field-card .form-section-label { margin: 0; }

    /* Field LDK & Akses Lintas Tier disembunyikan dengan transisi saat Role
       yang dipilih "Pengunjung" (tidak butuh cakupan organisasi apa pun) —
       BUKAN lewat @if (itu langsung mencabut dari DOM, tidak bisa dianimasi
       saat menutup). Pakai grid-template-rows 0fr<->1fr (bukan height/
       max-height langsung) supaya transisinya tetap mulus tanpa animasi
       height yang di-flag desain (layout-thrashing) — trik CSS Grid ini
       tidak menghitung sebagai animasi height/max-height. */
    .collapse { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--motion-slow) var(--ease-out), opacity var(--motion-fast) ease; }
    .collapse.open { grid-template-rows: 1fr; opacity: 1; }
    .collapse-inner { overflow: hidden; min-height: 0; }
    @media (prefers-reduced-motion: reduce) { .collapse { transition: none; } }
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
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;
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

  /** Role "Pengunjung" tidak pernah butuh cakupan organisasi — field LDK &
   *  Akses Lintas Tier disembunyikan (dengan transisi, lihat .collapse) saat
   *  role ini dipilih, ditampilkan lagi untuk role lain. Getter biasa (bukan
   *  computed()) karena `form.roleID` field polos, bukan signal — computed()
   *  tidak akan pernah re-run kalau bergantung padanya. */
  get isPengunjungRole(): boolean {
    return this.roles().find((r) => r.roleID === +this.form.roleID)?.roleName === 'Pengunjung';
  }

  /** Super Admin otomatis dianggap backend punya akses penuh ke seluruh tier
   *  (lihat effectiveWildcardTierAccess() di auth_service_impl.go) TERLEPAS
   *  dari isi wildcardTierAccess tersimpan — checkbox "Akses Lintas Tier"
   *  tetap tampil tapi auto-tercentang semua & dikunci (tidak bisa diuncheck
   *  manual) begitu role ini dipilih, supaya tampilan form tidak menyesatkan
   *  (seolah bisa parsial padahal backend selalu full akses untuk role ini). */
  get isSuperAdminRole(): boolean {
    return this.roles().find((r) => r.roleID === +this.form.roleID)?.roleName === 'Super Admin';
  }

  onRoleChange(v: unknown): void {
    const wasSuperAdmin = this.isSuperAdminRole;
    this.form.roleID = +(v as number);
    // Ganti ke Pengunjung saat field-nya sedang terisi -> kosongkan supaya
    // tidak diam-diam ikut terkirim saat field-nya sedang disembunyikan.
    if (this.isPengunjungRole) {
      this.form.organizationID = null;
      this.form.wildcardTierAccess = [];
    } else if (this.isSuperAdminRole) {
      // organizationID DIBIARKAN (dipakai keperluan lain, mis. widget waktu
      // sholat) — wildcardTierAccess auto-dicentang semua (lihat getter di atas).
      this.form.wildcardTierAccess = [...this.wildcardTiers];
    } else if (wasSuperAdmin) {
      // Baru saja PINDAH KELUAR dari Super Admin — lepas lagi centang
      // otomatisnya, supaya tidak diam-diam ikut terkirim sebagai grant
      // manual untuk role yang baru dipilih (mis. pindah ke Kader harus
      // dicentang ulang secara sadar kalau memang mau diberi akses lintas tier).
      this.form.wildcardTierAccess = [];
    }
  }

  canCreate = this.auth.hasPermission('user.create');
  canUpdate = this.auth.hasPermission('user.update');
  canDelete = this.auth.hasPermission('user.delete');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadRoles();
    if (this.showOrganizationPicker()) this.presenter.loadOrganizations();
  }

  /** Super Admin selalu direpresentasikan sebagai 3 tier tercentang di form
   *  (lihat isSuperAdminRole/onRoleChange) terlepas dari apa yang literal
   *  tersimpan di baris akun (mis. akun lama yang dibuat sebelum perilaku
   *  auto-centang ini ada) — dipakai openCreate/openEdit/openView supaya
   *  tampilan form konsisten dengan apa yang sudah di-override backend. */
  private resolveWildcardTierAccess(roleID: number, stored: string[]): string[] {
    const roleName = this.roles().find((r) => r.roleID === roleID)?.roleName;
    return roleName === 'Super Admin' ? [...this.wildcardTiers] : stored;
  }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = null;
    const roleID = this.roles()[0]?.roleID ?? 0;
    this.form = { ...emptyForm(roleID), wildcardTierAccess: this.resolveWildcardTierAccess(roleID, []) };
    this.showForm.set(true);
    this.animateModal(true);
  }
  openEdit(u: UserRow, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = u.userID;
    this.form = {
      fullName: u.fullName, email: u.email, password: '', roleID: u.roleID, isActive: u.isActive,
      organizationID: u.organizationID ?? null, wildcardTierAccess: this.resolveWildcardTierAccess(u.roleID, [...(u.wildcardTierAccess ?? [])]),
    };
    this.showForm.set(true);
    this.animateModal(true);
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
      organizationID: u.organizationID ?? null, wildcardTierAccess: this.resolveWildcardTierAccess(u.roleID, [...(u.wildcardTierAccess ?? [])]),
    };
    this.showForm.set(true);
    this.animateModal(true);
  }
  close(): void {
    this.animateModal(false);
    this.showForm.set(false);
  }

  /** Buka/tutup modal digerakkan lewat Web Animations API, BUKAN CSS
   *  transition — dua percobaan sebelumnya pakai transition (rAF ganda,
   *  lalu flag transition:none + reflow) sama-sama gagal, karena CSS
   *  transition pada `transform` selalu memakai nilai ter-paint TERAKHIR
   *  elemen sebagai titik awal, bukan --dx/--dy yang baru saja di-set —
   *  kalau origin popup berganti (mis. dari tombol Edit ke klik baris)
   *  sambil modal masih tertutup, titik awal itu tetap "nyangkut" di
   *  origin lama. `.animate()` tidak punya masalah ini: dx/dy dioper
   *  LANGSUNG sebagai nilai JS di keyframe, bukan lewat custom property.
   *
   *  `fill:'forwards'` dilepas lagi via `animation.cancel()` begitu selesai
   *  (bukan dibiarkan menggantung) — elemen yang terus-menerus "dianggap"
   *  sedang animasi transform jadi containing block baru untuk turunan
   *  position:fixed (dropdown Role/LDK di dalam modal ini), persis bug yang
   *  sudah pernah diperbaiki di .modal-pop global (lihat catatan panjang di
   *  styles.scss) — begitu animasi selesai & di-cancel, state akhirnya
   *  balik direpresentasikan CSS statis biasa (.modal-pop / .modal-pop.open). */
  private animateModal(opening: boolean): void {
    const el = this.modalEl?.nativeElement;
    if (!el) return;
    this.modalAnimation?.cancel();
    const { dx, dy } = this.popupOrigin();
    const closed: Keyframe = { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.25)` };
    const open: Keyframe = { opacity: 1, transform: 'none' };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const anim = el.animate(opening ? [closed, open] : [open, closed], {
      duration: reduceMotion ? 1 : 250, // samakan dengan --motion-slow
      easing: 'cubic-bezier(.16, 1, .3, 1)', // samakan dengan --ease-out
      fill: 'forwards',
    });
    this.modalAnimation = anim;
    anim.onfinish = () => {
      anim.cancel();
      if (this.modalAnimation === anim) this.modalAnimation = null;
    };
  }

  /** Tier bersifat hierarkis-kumulatif (LDK ⊂ Puskomda ⊂ Puskomnas, sama
   *  seperti TIER_RANK di AuthRepository.tierRank() frontend) — DB
   *  (wildcardTierAccess) & pengecekan backend (containsTier/IsAccessible)
   *  TIDAK mencakup otomatis, jadi mencentang Puskomnas saja tanpa ikut
   *  mencentang LDK/Puskomda akan salah menolak akses ke organisasi LDK/
   *  Puskomda walau niatnya akses nasional penuh. Representasikan selalu
   *  sebagai "prefix" hierarki: centang tier X -> ikut centang semua tier DI
   *  BAWAHNYA; uncentang tier X -> ikut uncentang semua tier DI ATASNYA
   *  (yang bergantung padanya tetap konsisten sebagai satu rank tertinggi). */
  toggleWildcardTier(tier: string): void {
    const idx = this.wildcardTiers.indexOf(tier as (typeof WILDCARD_TIERS)[number]);
    const checking = !this.form.wildcardTierAccess.includes(tier);
    this.form.wildcardTierAccess = this.wildcardTiers.slice(0, checking ? idx + 1 : idx);
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
