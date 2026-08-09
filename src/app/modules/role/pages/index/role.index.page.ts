import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { Role } from '../../entities/role';
import { Permission } from '../../../permission/entities/permission';
import { IconComponent } from '../../../../shared/icon.component';
import { RoleFormValue, RoleIndexPresenter } from './role.index.presenter';
import { RoleIndexView } from './role.index.view';

@Component({
  selector: 'app-role-index-page',
  standalone: true,
  templateUrl: './role.index.page.html',
  imports: [FormsModule, IconComponent],
  providers: [RoleIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    /* Modal jadi kolom flex dengan tinggi tetap: judul tetap di alur normal
       (tidak ikut scroll), .modal-columns mengisi sisa tinggi yang ada, dan
       footer Batal/Simpan dikunci di bawah (flex-shrink:0) supaya tidak
       pernah ikut hilang saat scroll. Modal dilebarkan (820px) supaya field
       role (kiri) dan daftar permission (kanan) bisa berdampingan sebagai
       dua kolom terpisah dalam satu popup yang sama — permission jadi lebih
       leluasa, tidak lagi berdesakan di bawah field yang sempit. */
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 820px; max-height: 86vh; display: flex; flex-direction: column; }
    .modal-columns { display: flex; gap: 28px; flex: 1 1 auto; min-height: 0; margin-top: 18px; }
    .modal-col-left { width: 260px; flex-shrink: 0; }
    .modal-col-right { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; border-left: 1px solid var(--color-border); padding-left: 28px; }
    .perm-col-title { margin-bottom: 12px; }
    .perm-list { display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 80px; overflow-y: auto; padding-right: 4px; }
    /* Tiap modul jadi satu kartu, dan tiap baris permission di dalamnya jadi
       satu field yang menyatu (padding, radius, hover) alih-alih checkbox +
       teks lepas — senada dengan gaya baris pada app-select. Kartu dibuat
       putih bersih (senada .card di tempat lain) dan hover/baris yang sudah
       dicentang memakai tint hijau --color-primary-soft yang sama dipakai
       chip/badge/form-check di seluruh app — sebelumnya kartu abu-abu +
       hover putih terasa lepas dari pola warna itu. */
    .perm-mod { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 14px; }
    .perm-mod strong { text-transform: capitalize; display: block; margin-bottom: 8px; padding: 0 4px; font-size: .95rem; }
    .perm-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: .9rem; cursor: pointer; transition: background var(--motion-fast) ease; }
    .perm-item:hover, .perm-item:has(input:checked) { background: var(--color-primary-soft); }
    .perm-item code { margin-left: auto; color: var(--color-muted); font-size: .76rem; background: var(--color-bg-alt); padding: 3px 7px; border-radius: 6px; flex-shrink: 0; }
    .modal-footer { flex-shrink: 0; padding-top: 16px; }
    @media (max-width: 720px) {
      .modal-columns { flex-direction: column; overflow-y: auto; }
      .modal-col-left { width: 100%; }
      .modal-col-right { border-left: none; padding-left: 0; }
    }
    .card-actions { display: flex; align-items: center; gap: 14px; }
    .link-danger[aria-disabled="true"] { color: var(--color-muted); cursor: not-allowed; pointer-events: none; }
  `],
})
export class RoleIndexPage implements OnInit, RoleIndexView {
  private presenter = inject(RoleIndexPresenter);
  private auth = inject(AuthRepository);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId: number | null = null;
  editingSystemRole = false;
  selected = new Set<number>();
  saving = signal(false);
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

  grouped(): Record<string, Permission[]> {
    return this.permissions().reduce((acc, p) => {
      (acc[p.moduleName] ||= []).push(p);
      return acc;
    }, {} as Record<string, Permission[]>);
  }
  moduleKeys(): string[] { return Object.keys(this.grouped()); }

  openCreate(): void {
    this.editId = null;
    this.editingSystemRole = false;
    this.form = { roleName: '', roleDescription: '', isActive: true };
    this.selected = new Set();
    this.showForm.set(true);
  }
  openEdit(r: Role): void {
    this.editId = r.roleID;
    this.editingSystemRole = r.isSystemRole;
    this.form = { roleName: r.roleName, roleDescription: r.roleDescription, isActive: r.isActive };
    this.selected = new Set(r.permissionIDs);
    this.showForm.set(true);
  }
  toggle(id: number): void { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }
  close(): void { this.showForm.set(false); }

  save(): void { this.presenter.save(this.editId, this.form, [...this.selected]); }

  remove(r: Role): void {
    if (r.isSystemRole || r.userCount > 0) return;
    if (!confirm(`Hapus role "${r.roleName}"?`)) return;
    this.presenter.remove(r.roleID);
  }

  setRoles(roles: Role[]): void { this.roles.set(roles); this.loading.set(false); }
  setPermissions(permissions: Permission[]): void { this.permissions.set(permissions); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.loading.set(true); this.presenter.loadRoles(); }
  onRemoveSuccess(): void { this.loading.set(true); this.presenter.loadRoles(); }
}
