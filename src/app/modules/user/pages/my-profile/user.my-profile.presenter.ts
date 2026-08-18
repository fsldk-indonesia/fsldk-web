import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthRepository } from '../../repositories/auth.repository';
import { UserMyProfileView } from './user.my-profile.view';

@Injectable()
export class UserMyProfilePresenter extends BasePresenter<UserMyProfileView> {
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);

  changePassword(oldPassword: string, newPassword: string): void {
    this.view.setSaving(true);
    this.auth.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.view.setSaving(false);
        this.toast.success('Kata sandi berhasil diperbarui');
        this.view.onChangePasswordSuccess();
      },
      error: () => this.view.setSaving(false),
    });
  }
}
