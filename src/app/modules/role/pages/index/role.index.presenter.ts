import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { RoleRepository } from '../../repositories/role.repository';
import { PermissionRepository } from '../../../permission/repositories/permission.repository';
import { RoleIndexView } from './role.index.view';

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

  savePermissions(roleID: number, permissionIDs: number[]): void {
    this.view.setSaving(true);
    this.roleRepo.setPermissions(roleID, permissionIDs).subscribe({
      next: () => {
        this.toast.success('Permission diperbarui');
        this.view.setSaving(false);
        this.view.onSavePermissionsSuccess();
      },
      error: () => this.view.setSaving(false),
    });
  }
}
