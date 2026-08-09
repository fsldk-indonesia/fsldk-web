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
    /* Modal jadi kolom flex dengan tinggi tetap: judul, Nama Role, Deskripsi,
       Aktif, dan judul "Centang permission..." tetap di alur normal (tidak
       ikut scroll), hanya .perm-list yang jadi area scroll sendiri (flex:1,
       overflow-y:auto), sementara footer Batal/Simpan dikunci di bawah
       (flex-shrink:0) supaya tidak pernah ikut hilang saat scroll. */
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 560px; max-height: 86vh; display: flex; flex-direction: column; }
    .perm-list { display: flex; flex-direction: column; gap: 14px; margin: 16px 0; flex: 1 1 auto; min-height: 80px; overflow-y: auto; padding-right: 4px; }
    /* Tiap modul jadi satu kartu, dan tiap baris permission di dalamnya jadi
       satu field yang menyatu (padding, radius, hover) alih-alih checkbox +
       teks lepas — senada dengan gaya baris pada app-select. */
    .perm-mod { border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: var(--color-bg-alt); padding: 12px; }
    .perm-mod strong { text-transform: capitalize; display: block; margin-bottom: 6px; padding: 0 4px; font-size: .95rem; }
    .perm-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: .9rem; cursor: pointer; transition: background var(--motion-fast) ease; }
    .perm-item:hover { background: #fff; }
    .perm-item code { margin-left: auto; color: var(--color-muted); font-size: .76rem; background: #fff; padding: 3px 7px; border-radius: 6px; flex-shrink: 0; }
    .modal-footer { flex-shrink: 0; padding-top: 16px; }
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
