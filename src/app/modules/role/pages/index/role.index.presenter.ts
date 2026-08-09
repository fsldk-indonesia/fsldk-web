import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { RoleRepository } from '../../repositories/role.repository';
import { PermissionRepository } from '../../../permission/repositories/permission.repository';
import { RoleIndexView } from './role.index.view';

export interface RoleFormValue {
  roleName: string;
  roleDescription: string;
  isActive: boolean;
}

@Injectable()
export class RoleIndexPresenter extends BasePresenter<RoleIndexView> {
  private roleRepo = inject(RoleRepository);
  private permissionRepo = inject(PermissionRepository);
  private toast = inject(ToastService);

  loadRoles(): void {
    this.roleRepo.list().subscribe({ next: (r) => this.view.setRoles(r), error: () => {} });
  }

  loadPermissions(): void {
    this.permissionRepo.list().subscribe({ next: (p) => this.view.setPermissions(p), error: () => {} });
  }

  save(editId: number | null, form: RoleFormValue, permissionIDs: number[]): void {
    this.view.setSaving(true);
    const body = { roleName: form.roleName, roleDescription: form.roleDescription, isActive: form.isActive };
    const afterUpsert = (roleID: number) => {
      this.roleRepo.setPermissions(roleID, permissionIDs).subscribe({
        next: () => {
          this.toast.success(editId ? 'Role diperbarui' : 'Role dibuat');
          this.view.setSaving(false);
          this.view.onSaveSuccess();
        },
        error: () => this.view.setSaving(false),
      });
    };
    if (editId) {
      this.roleRepo.update(editId, body).subscribe({
        next: () => afterUpsert(editId),
        error: () => this.view.setSaving(false),
      });
    } else {
      this.roleRepo.create({ roleName: form.roleName, roleDescription: form.roleDescription }).subscribe({
        next: (r) => afterUpsert(r.roleID),
        error: () => this.view.setSaving(false),
      });
    }
  }

  remove(roleID: number): void {
    this.roleRepo.remove(roleID).subscribe({
      next: () => { this.toast.success('Role dihapus'); this.view.onRemoveSuccess(); },
      error: () => {},
    });
  }
}
