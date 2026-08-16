import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationLdkListView } from './organization.ldk-list.view';

export interface LdkFormValue {
  organizationName: string;
  organizationCode: string;
  provinceName: string;
  cityName: string;
  contactEmail: string;
  contactPhone: string;
  parentOrganizationID: number | null;
}

@Injectable()
export class OrganizationLdkListPresenter extends BasePresenter<OrganizationLdkListView> {
  private orgRepo = inject(OrganizationRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, search: string): void {
    this.orgRepo.list({ organizationTypeCode: 'LDK', page, limit, search }).subscribe({
      next: (p) => this.view.setOrganizations(p.data, p.count),
      error: () => {},
    });
  }

  loadPuskomdaOptions(): void {
    this.orgRepo.list({ organizationTypeCode: 'PUSKOMDA', limit: 100 }).subscribe({
      next: (p) => this.view.setPuskomdaOptions(p.data.map((o) => ({ value: o.organizationID, label: o.organizationName }))),
      error: () => {},
    });
  }

  create(form: LdkFormValue): void {
    this.view.setSaving(true);
    const body: Record<string, unknown> = {
      organizationTypeCode: 'LDK',
      organizationName: form.organizationName,
      organizationCode: form.organizationCode,
      provinceName: form.provinceName,
      cityName: form.cityName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
    };
    if (form.parentOrganizationID) body['parentOrganizationID'] = form.parentOrganizationID;
    this.orgRepo.create(body).subscribe({
      next: () => { this.toast.success('LDK berhasil ditambahkan'); this.view.setSaving(false); this.view.onSaveSuccess(); },
      error: () => this.view.setSaving(false),
    });
  }

  deactivate(id: number): void {
    this.orgRepo.deactivate(id).subscribe({
      next: () => { this.toast.success('LDK dinonaktifkan'); this.view.onActionSettled(id); this.view.onSaveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }

  reactivate(id: number): void {
    this.orgRepo.reactivate(id).subscribe({
      next: () => { this.toast.success('LDK diaktifkan kembali'); this.view.onActionSettled(id); this.view.onSaveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
