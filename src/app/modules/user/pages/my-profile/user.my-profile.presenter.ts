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

  /** Hanya relevan untuk akun Kader. Dipanggil dari akun manapun (termasuk
   *  role CMS tanpa permission 'submission.view', mis. role custom
   *  non-Super-Admin) — GET /submissions mengembalikan 403 untuk akun
   *  tanpa permission itu, jadi request ini ditandai silent supaya tidak
   *  menampilkan toast error untuk pengecekan latar belakang yang opsional
   *  ini (hasilnya cukup di-null-kan, lihat error handler di bawah). */
  loadKaderInfo(): void {
    this.submissionRepo.findMine(FORM_CODE_SENSUS_KADER, undefined, { silent: true }).pipe(
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

  /** Foto tersimpan otomatis begitu unggahan selesai (app-image-upload sudah
   *  mengunggah berkasnya ke server saat ini dipanggil) — tidak perlu tombol
   *  simpan terpisah untuk satu field ini. */
  updatePhoto(photoURL: string): void {
    this.view.setPhotoSaving(true);
    this.auth.updatePhoto(photoURL).subscribe({
      next: () => { this.view.setPhotoSaving(false); this.toast.success('Foto profil berhasil diperbarui'); },
      error: () => this.view.setPhotoSaving(false),
    });
  }
}
