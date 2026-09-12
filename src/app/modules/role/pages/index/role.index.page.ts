import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { Role } from '../../entities/role';
import { Permission } from '../../../permission/entities/permission';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { RoleFormValue, RoleIndexPresenter } from './role.index.presenter';
import { RoleIndexView } from './role.index.view';

@Component({
  selector: 'app-role-index-page',
  standalone: true,
  templateUrl: './role.index.page.html',
  imports: [FormsModule, IconComponent, ModalBackdropDirective, PaginationComponent],
  providers: [RoleIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    /* Kotak cari nama role di index — input + ikon kaca pembesar menyatu
       dalam satu kotak (bukan input + tombol terpisah lagi), sama pola
       .search-combo di CmsIndexComponent. */
    .role-search {
      position: relative; display: flex; align-items: stretch;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff;
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .role-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .role-search input { flex: 1; min-width: 0; border: none; background: transparent; padding: 12px 14px; font-size: .95rem; font-family: var(--font-body); }
    .role-search input:focus { outline: none; }
    .role-search-btn { display: flex; align-items: center; justify-content: center; width: 40px; flex-shrink: 0; border: none; background: transparent; color: var(--color-muted); cursor: pointer; transition: color var(--motion-fast) ease; }
    .role-search-btn:hover { color: var(--color-primary-dark); }
    .role-search:focus-within .role-search-btn { color: var(--color-primary); }

    /* Kotak cari-dalam-daftar permission di popup — dipakai bareng
       filteredGrouped()/filteredModuleKeys() (filter client-side, daftar
       permission sudah dimuat penuh sekali di ngOnInit). */
    .perm-search {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 9px 12px;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); color: var(--color-muted);
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .perm-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); color: var(--color-primary); }
    .perm-search input { flex: 1; border: none; background: transparent; font-size: .88rem; font-family: var(--font-body); color: var(--color-text); }
    .perm-search input:focus { outline: none; }

    /* Backdrop & kartu SELALU ter-render (bukan @if) supaya transisi TUTUP
       kelihatan, sama pola dengan popup Pengguna. */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    /* Buka/tutup modal digerakkan lewat Web Animations API (lihat
       animateModal() di komponen) — BUKAN CSS transition. CSS di sini cuma
       merepresentasikan dua state statis (tertutup/terbuka di keadaan diam).
       Lihat catatan panjang di user.index.page.ts untuk alasannya: CSS
       transition pada transform selalu memakai nilai ter-paint TERAKHIR
       sebagai titik awal, jadi kalau origin popup berganti (mis. Edit Role A
       lalu Edit Role B di posisi tombol berbeda) sambil modal masih
       tertutup, transisi buka salah mulai dari origin yang lama.
       Modal jadi kolom flex dengan tinggi tetap: judul tetap di alur normal
       (tidak ikut scroll), .modal-columns mengisi sisa tinggi yang ada, dan
       footer Batal/Simpan dikunci di bawah (flex-shrink:0). Modal dilebarkan
       (820px) supaya field role (kiri) dan daftar permission (kanan) bisa
       berdampingan sebagai dua kolom terpisah dalam satu popup yang sama. */
    .modal.modal-pop {
      position: relative; background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 820px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }

    .modal-close {
      position: absolute; top: 14px; right: 14px; z-index: 1; display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent; color: var(--color-muted);
      cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .modal-close:hover { background: var(--color-bg-alt); color: var(--color-text); }

    .modal-columns { display: flex; gap: 28px; flex: 1 1 auto; min-height: 0; margin-top: 18px; }
    /* overflow-y sendiri (bukan cuma flex-column tanpa batas) — tanpa ini,
       kalau section Informasi Role + Status lebih tinggi dari ruang yang
       ada, isinya meluber lewat batas modal alih-alih di-scroll di dalam
       kolomnya sendiri (kelihatan "nabrak" ke footer). Kolom kanan sudah
       aman lewat overflow-y:auto di .perm-list, kolom kiri sekarang sama. */
    .modal-col-left { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; min-height: 0; padding-right: 4px; }
    .modal-col-right { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; border-left: 1px solid var(--color-border); padding-left: 28px; }
    /* Header per-kelompok field — sama pola form-section-label Pengguna/
       Berita (icon-badge + label uppercase), tanpa dibungkus .card lagi. */
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-section-group + .form-section-group { padding-top: 18px; border-top: 1px solid var(--color-border); }
    /* Panel "sumur" (background tint + inset shadow atas-bawah) — dulu
       .perm-list cuma daftar polos tanpa batas, jadi kartu modul yang
       terpotong scroll di tepi atas/bawah terasa "nabrak" langsung ke
       konten modal. Sekarang jadi wadah yang jelas terlihat sebagai area
       scroll tersendiri, kartu modul (putih) kontras di atasnya. */
    .perm-list {
      display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 80px; overflow-y: auto;
      padding: 12px; margin: 0 -4px; border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
    /* Tiap modul jadi satu kartu, dan tiap baris permission di dalamnya jadi
       satu field yang menyatu (padding, radius, hover) alih-alih checkbox +
       teks lepas — senada dengan gaya baris pada app-select. Kartu dibuat
       putih bersih (senada .card di tempat lain) dan hover/baris yang sudah
       dicentang memakai tint hijau --color-primary-soft yang sama dipakai
       chip/badge/form-check di seluruh app — sebelumnya kartu abu-abu +
       hover putih terasa lepas dari pola warna itu. */
    .perm-mod { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 14px; }
    /* Header modul jadi checkbox "centang semua permission modul ini" —
       dulu cuma <strong> polos. */
    .perm-mod-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 0 4px; cursor: pointer; }
    .perm-mod-header strong { text-transform: capitalize; font-size: .95rem; }
    /* "Pilih Semua" global, di atas daftar modul — beroperasi atas hasil
       filter permSearch (lihat allFilteredPermissionIDs), bukan seluruh
       daftar permission. */
    .perm-select-all { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 0 4px; font-size: .85rem; font-weight: 700; color: var(--color-primary-dark); cursor: pointer; }
    .perm-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: .9rem; cursor: pointer; transition: background var(--motion-fast) ease; }
    .perm-item:hover, .perm-item:has(input:checked) { background: var(--color-primary-soft); }
    .perm-item code { margin-left: auto; color: var(--color-muted); font-size: .76rem; background: var(--color-bg-alt); padding: 3px 7px; border-radius: 6px; flex-shrink: 0; }
    /* Batal & Simpan berdampingan di kanan (bukan justify-between) — sama
       seperti .form-actions Berita/Pengguna. */
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; padding-top: 16px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    @media (max-width: 720px) {
      .modal-columns { flex-direction: column; overflow-y: auto; }
      .modal-col-left { width: 100%; }
      .modal-col-right { border-left: none; padding-left: 0; }
    }
    .card-actions { display: flex; align-items: center; gap: 14px; }
    .link-danger[aria-disabled="true"] { color: var(--color-muted); cursor: not-allowed; pointer-events: none; }
    /* Grid menyamakan TINGGI kartu (perilaku default CSS Grid), tapi baris
       Hapus/Edit Role di dalamnya tetap mengikuti alur konten biasa — kartu
       dengan sedikit konten (mis. role tanpa daftar permission) jadi punya
       baris aksi yang lebih tinggi posisinya daripada kartu lain, tidak
       sejajar. Kartu dijadikan flex-column dan footer dikunci ke bawah lewat
       margin-top:auto supaya baris aksi selalu sejajar lintas kartu terlepas
       dari seberapa banyak kontennya. */
    .grid-2 > .card { display: flex; flex-direction: column; }
    .card-footer { margin-top: auto; padding-top: 16px; }
  `],
})
export class RoleIndexPage implements OnInit, RoleIndexView {
  private presenter = inject(RoleIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  loading = signal(true);
  search = '';
  // Pagination murni client-side — roleRepo.list() selalu mengembalikan
  // SEMUA role sekaligus (datanya kecil, tidak ada dukungan page/limit di
  // backend), jadi cukup di-slice di sini, tidak perlu roundtrip server.
  page = signal(1);
  readonly limit = 6;
  showForm = signal(false);
  editId: number | null = null;
  // Klik kartu (di luar area Hapus/Edit Role, lihat template) membuka popup
  // yang sama dalam mode baca-saja — sama pola dengan viewOnly di
  // Berita/Artikel/Pengguna.
  isReadonly = false;
  editingSystemRole = false;
  selected = new Set<number>();
  saving = signal(false);
  // Cari-dalam-daftar untuk permission di popup (client-side, daftarnya
  // sudah dimuat penuh sekali di ngOnInit) — beda dari `search` index yang
  // ke server tiap Enter, ini murni filter lokal atas grouped()/moduleKeys().
  permSearch = '';
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;
  form: RoleFormValue = { roleName: '', roleDescription: '', isActive: true };
  canCreate = this.auth.hasPermission('role.create');
  canUpdate = this.auth.hasPermission('role.update');
  canDelete = this.auth.hasPermission('role.delete');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.loading.set(true);
    this.presenter.loadRoles();
    this.presenter.loadPermissions();
  }

  applySearch(): void {
    this.loading.set(true);
    this.page.set(1);
    this.presenter.loadRoles(this.search);
  }

  pagedRoles(): Role[] {
    const start = (this.page() - 1) * this.limit;
    return this.roles().slice(start, start + this.limit);
  }
  goPage(p: number): void { this.page.set(p); }

  grouped(): Record<string, Permission[]> {
    return this.permissions().reduce((acc, p) => {
      (acc[p.moduleName] ||= []).push(p);
      return acc;
    }, {} as Record<string, Permission[]>);
  }
  moduleKeys(): string[] { return Object.keys(this.grouped()); }

  /** Versi grouped()/moduleKeys() yang sudah difilter permSearch — dipakai
   *  template popup, cocok kalau nama modul, nama permission, ATAU kode
   *  permission-nya mengandung kata kunci (modul ikut cocok supaya ketik
   *  "berita" langsung menampilkan seluruh grup Berita, bukan cuma baris
   *  yang literal mengandung kata itu di nama/kode permission-nya). */
  filteredGrouped(): Record<string, Permission[]> {
    const q = this.permSearch.trim().toLowerCase();
    if (!q) return this.grouped();
    const result: Record<string, Permission[]> = {};
    for (const [mod, perms] of Object.entries(this.grouped())) {
      const matched = mod.toLowerCase().includes(q)
        ? perms
        : perms.filter((p) => p.permissionName.toLowerCase().includes(q) || p.permissionCode.toLowerCase().includes(q));
      if (matched.length) result[mod] = matched;
    }
    return result;
  }
  filteredModuleKeys(): string[] { return Object.keys(this.filteredGrouped()); }

  /** "Pilih Semua" & centang per-modul BEROPERASI ATAS HASIL FILTER
   *  (filteredGrouped), bukan seluruh daftar permission — konsisten dengan
   *  ekspektasi umum "select all" mengikuti apa yang sedang terlihat, dan
   *  supaya mengetik kata kunci lalu centang tidak diam-diam ikut mencentang
   *  permission lain yang sedang disembunyikan pencarian. */
  private modulePermissionIDs(mod: string): number[] {
    return (this.filteredGrouped()[mod] ?? []).map((p) => p.permissionID);
  }
  private allFilteredPermissionIDs(): number[] {
    return Object.keys(this.filteredGrouped()).flatMap((mod) => this.modulePermissionIDs(mod));
  }

  isModuleFullySelected(mod: string): boolean {
    const ids = this.modulePermissionIDs(mod);
    return ids.length > 0 && ids.every((id) => this.selected.has(id));
  }
  isModulePartiallySelected(mod: string): boolean {
    const ids = this.modulePermissionIDs(mod);
    return ids.some((id) => this.selected.has(id)) && !this.isModuleFullySelected(mod);
  }
  toggleModule(mod: string): void {
    if (this.isReadonly) return;
    const ids = this.modulePermissionIDs(mod);
    if (this.isModuleFullySelected(mod)) ids.forEach((id) => this.selected.delete(id));
    else ids.forEach((id) => this.selected.add(id));
  }

  get allFilteredSelected(): boolean {
    const ids = this.allFilteredPermissionIDs();
    return ids.length > 0 && ids.every((id) => this.selected.has(id));
  }
  get someFilteredSelected(): boolean {
    return this.allFilteredPermissionIDs().some((id) => this.selected.has(id));
  }
  toggleSelectAll(): void {
    if (this.isReadonly) return;
    const ids = this.allFilteredPermissionIDs();
    if (this.allFilteredSelected) ids.forEach((id) => this.selected.delete(id));
    else ids.forEach((id) => this.selected.add(id));
  }

  get modalTitle(): string {
    if (this.isReadonly) return 'Detail Role';
    return this.editId ? 'Ubah Role' : 'Tambah Role';
  }
  get modalSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail & hak akses role ini.';
    return this.editId ? 'Perbarui informasi & hak akses role ini.' : 'Isi informasi role & pilih permission yang diberikan.';
  }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = null;
    this.editingSystemRole = false;
    this.form = { roleName: '', roleDescription: '', isActive: true };
    this.selected = new Set();
    this.permSearch = '';
    this.showForm.set(true);
    this.animateModal(true);
  }
  openEdit(r: Role, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = false;
    this.editId = r.roleID;
    this.editingSystemRole = r.isSystemRole;
    this.form = { roleName: r.roleName, roleDescription: r.roleDescription, isActive: r.isActive };
    this.selected = new Set(r.permissionIDs);
    this.permSearch = '';
    this.showForm.set(true);
    this.animateModal(true);
  }
  // Dipicu klik kartu (di luar area Hapus/Edit Role, lihat template) — beda
  // dari openEdit, field-nya jadi baca-saja.
  openView(r: Role, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.isReadonly = true;
    this.editId = r.roleID;
    this.editingSystemRole = r.isSystemRole;
    this.form = { roleName: r.roleName, roleDescription: r.roleDescription, isActive: r.isActive };
    this.selected = new Set(r.permissionIDs);
    this.permSearch = '';
    this.showForm.set(true);
    this.animateModal(true);
  }
  toggle(id: number): void {
    if (this.isReadonly) return;
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
  }
  close(): void {
    this.animateModal(false);
    this.showForm.set(false);
  }

  /** Buka/tutup modal lewat Web Animations API — lihat catatan panjang di
   *  user.index.page.ts (animateModal) untuk alasan lengkapnya: CSS
   *  transition pada transform selalu memakai nilai ter-paint TERAKHIR
   *  sebagai titik awal, jadi kalau origin popup berganti (Edit Role A lalu
   *  Edit Role B di posisi tombol berbeda) sambil modal masih tertutup,
   *  transisi buka salah mulai dari origin lama. dx/dy dioper langsung
   *  sebagai nilai JS ke keyframe .animate(), bukan lewat custom property.
   *  Animasinya di-cancel lagi setelah selesai (bukan dibiarkan menggantung
   *  dengan fill:'forwards') supaya modal tidak terus-menerus jadi
   *  containing block baru untuk turunan position:fixed di dalamnya. */
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

  save(): void { this.presenter.save(this.editId, this.form, [...this.selected]); }

  async remove(r: Role, event?: Event): Promise<void> {
    if (r.isSystemRole || r.userCount > 0) return;
    const ok = await this.alert.confirm(`Hapus role "${r.roleName}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Role', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.remove(r.roleID);
  }

  setRoles(roles: Role[]): void {
    this.roles.set(roles);
    this.loading.set(false);
    // Jaga-jaga: kalau role di halaman terakhir dihapus sehingga total
    // halaman berkurang, turunkan page() ke halaman valid terakhir alih-alih
    // menampilkan grid kosong padahal masih ada role di halaman sebelumnya.
    const totalPages = Math.max(1, Math.ceil(roles.length / this.limit));
    if (this.page() > totalPages) this.page.set(totalPages);
  }
  setPermissions(permissions: Permission[]): void { this.permissions.set(permissions); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.loading.set(true); this.presenter.loadRoles(); }
  onRemoveSuccess(): void { this.loading.set(true); this.presenter.loadRoles(); }
}
