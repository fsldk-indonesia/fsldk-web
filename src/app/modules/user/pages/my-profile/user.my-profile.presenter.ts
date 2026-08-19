import { Injectable, inject } from '@angular/core';
import { switchMap, of } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthRepository } from '../../repositories/auth.repository';
import { SubmissionRepository } from '../../../submission/repositories/submission.repository';
import { FORM_CODE_SENSUS_KADER } from '../../../submission/entities/submission';
import { UserMyProfileView } from './user.my-profile.view';

@Injectable()
export class UserMyProfilePresenter extends BasePresenter<UserMyProfileView> {
  private auth = inject(AuthRepository);
  private submissionRepo = inject(SubmissionRepository);
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

  /** Hanya relevan untuk akun Kader (findMine mengembalikan null untuk akun
   *  tanpa pendaftaran Sensus Kader — aman dipanggil dari akun manapun). */
  loadKaderInfo(): void {
    this.submissionRepo.findMine(FORM_CODE_SENSUS_KADER).pipe(
      switchMap((mine) => (mine ? this.submissionRepo.get(mine.submissionID) : of(null))),
    ).subscribe({
      next: (detail) => this.view.setKader(detail?.kader ?? null),
      error: () => this.view.setKader(null),
    });
  }

  updateContact(phoneNumber: string, address: string): void {
    this.view.setContactSaving(true);
    this.auth.updateContact({ phoneNumber, address }).subscribe({
      next: () => { this.view.setContactSaving(false); this.toast.success('Kontak berhasil diperbarui'); },
      error: () => this.view.setContactSaving(false),
    });
  }
}
