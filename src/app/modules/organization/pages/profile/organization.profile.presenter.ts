import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationProfileView } from './organization.profile.view';

export interface OrganizationProfileFormValue {
  organizationName: string;
  provinceName: string;
  cityName: string;
  contactEmail: string;
  contactPhone: string;
}

@Injectable()
export class OrganizationProfilePresenter extends BasePresenter<OrganizationProfileView> {
  private orgRepo = inject(OrganizationRepository);
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);

  load(): void {
    const id = this.auth.user()?.organizationID;
    if (!id) return;
    this.orgRepo.get(id).subscribe({ next: (o) => this.view.setOrganization(o), error: () => {} });
  }

  save(form: OrganizationProfileFormValue): void {
    const id = this.auth.user()?.organizationID;
    if (!id) return;
    this.view.setSaving(true);
    this.orgRepo.update(id, form).subscribe({
      next: (o) => {
        this.toast.success('Profil organisasi diperbarui');
        this.view.setSaving(false);
        this.view.setOrganization(o);
        this.view.onSaveSuccess();
      },
      error: () => this.view.setSaving(false),
    });
  }
}
