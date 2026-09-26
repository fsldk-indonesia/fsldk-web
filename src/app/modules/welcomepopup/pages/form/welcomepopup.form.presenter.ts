import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { WelcomepopupRepository } from '../../repositories/welcomepopup.repository';
import { WelcomePopupUpdatePayload } from '../../entities/welcome-popup';
import { WelcomepopupFormView } from './welcomepopup.form.view';

@Injectable()
export class WelcomepopupFormPresenter extends BasePresenter<WelcomepopupFormView> {
  private repo = inject(WelcomepopupRepository);
  private toast = inject(ToastService);

  load(): void {
    this.view.setLoading(true);
    this.repo.get().subscribe({
      next: (data) => { this.view.setForm(data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  save(payload: WelcomePopupUpdatePayload): void {
    this.view.setSaving(true);
    this.repo.update(payload).subscribe({
      next: (data) => {
        this.toast.success('Welcome Popup berhasil disimpan.');
        this.view.setForm(data);
        this.view.setSaving(false);
      },
      error: () => this.view.setSaving(false),
    });
  }
}
