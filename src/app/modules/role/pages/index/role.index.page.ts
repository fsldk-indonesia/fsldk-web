import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { Role } from '../../entities/role';
import { Permission } from '../../../permission/entities/permission';
import { RoleFormValue, RoleIndexPresenter } from './role.index.presenter';
import { RoleIndexView } from './role.index.view';

@Component({
  selector: 'app-role-index-page',
  standalone: true,
  templateUrl: './role.index.page.html',
  imports: [FormsModule],
  providers: [RoleIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 560px; max-height: 86vh; overflow: auto; }
    .perm-list { display: flex; flex-direction: column; gap: 16px; margin: 16px 0; }
    .perm-mod strong { text-transform: capitalize; display: block; margin-bottom: 8px; }
    .perm-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: .9rem; }
    .perm-item code { color: var(--color-muted); font-size: .78rem; }
  `],
})
export class RoleIndexPage implements OnInit, RoleIndexView {
  private presenter = inject(RoleIndexPresenter);
  private auth = inject(AuthRepository);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  showForm = signal(false);
  editId: number | null = null;
  editingSystemRole = false;
  selected = new Set<number>();
  saving = signal(false);
  form: RoleFormValue = { roleName: '', roleDescription: '', isActive: true };
  canCreate = this.auth.hasPermission('role.create');
  canUpdate = this.auth.hasPermission('role.update');

  ngOnInit(): void {
    this.presenter.attachView(this);
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

  setRoles(roles: Role[]): void { this.roles.set(roles); }
  setPermissions(permissions: Permission[]): void { this.permissions.set(permissions); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.presenter.loadRoles(); }
}
