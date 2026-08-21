import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationPuskomdaListView } from './organization.puskomda-list.view';

export interface PuskomdaFormValue {
  organizationName: string;
  organizationCode: string;
  provinceName: string;
  cityName: string;
  contactEmail: string;
  contactPhone: string;
}

@Injectable()
export class OrganizationPuskomdaListPresenter extends BasePresenter<OrganizationPuskomdaListView> {
  private orgRepo = inject(OrganizationRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, search: string): void {
    this.orgRepo.list({ organizationTypeCode: 'PUSKOMDA', page, limit, search }).subscribe({
      next: (p) => this.view.setOrganizations(p.data, p.count),
      error: () => {},
    });
  }

  create(form: PuskomdaFormValue): void {
    this.view.setSaving(true);
    this.orgRepo.create({ organizationTypeCode: 'PUSKOMDA', ...form }).subscribe({
      next: () => { this.toast.success('Puskomda berhasil ditambahkan'); this.view.setSaving(false); this.view.onSaveSuccess(); },
      error: () => this.view.setSaving(false),
    });
  }

  deactivate(id: number): void {
    this.orgRepo.deactivate(id).subscribe({
      next: () => { this.toast.success('Puskomda dinonaktifkan'); this.view.onActionSettled(id); this.view.onSaveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }

  reactivate(id: number): void {
    this.orgRepo.reactivate(id).subscribe({
      next: () => { this.toast.success('Puskomda diaktifkan kembali'); this.view.onActionSettled(id); this.view.onSaveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
