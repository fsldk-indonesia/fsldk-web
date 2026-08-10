import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../../role/repositories/role.repository';
import { UserIndexView } from './user.index.view';

export interface UserFormValue {
  fullName: string;
  email: string;
  password: string;
  roleID: number;
  isActive: boolean;
}

@Injectable()
export class UserIndexPresenter extends BasePresenter<UserIndexView> {
  private userRepo = inject(UserRepository);
  private roleRepo = inject(RoleRepository);
  private toast = inject(ToastService);

  loadUsers(page: number, limit: number, search: string): void {
    this.userRepo.list({ page, limit, search }).subscribe({
      next: (p) => this.view.setUsers(p.data, p.count),
      error: () => {},
    });
  }

  loadRoles(): void {
    this.roleRepo.list().subscribe({ next: (r) => this.view.setRoles(r), error: () => {} });
  }

  save(editId: number | null, form: UserFormValue): void {
    this.view.setSaving(true);
    if (editId) {
      this.userRepo.update(editId, { fullName: form.fullName, email: form.email, roleID: +form.roleID, isActive: form.isActive, password: form.password }).subscribe({
        next: () => { this.toast.success('Pengguna diperbarui'); this.view.setSaving(false); this.view.onSaveSuccess(); },
        error: () => this.view.setSaving(false),
      });
    } else {
      this.userRepo.create({ fullName: form.fullName, email: form.email, password: form.password, roleID: +form.roleID, isActive: form.isActive }).subscribe({
        next: () => { this.toast.success('Pengguna dibuat'); this.view.setSaving(false); this.view.onSaveSuccess(); },
        error: () => this.view.setSaving(false),
      });
    }
  }

  remove(id: number): void {
    this.userRepo.remove(id).subscribe({
      next: () => { this.toast.success('Pengguna dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
