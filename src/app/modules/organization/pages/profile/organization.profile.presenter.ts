import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
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
  private orgContext = inject(OrgContextService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  /** organizationID LDK yang sedang dilihat (bukan selalu home org caller —
   *  lihat OrgContextService). Disimpan supaya save() memakai id yang sama
   *  persis dengan yang baru saja ditampilkan load(), bukan re-resolve
   *  home org yang mungkin beda dari organisasi yang sedang dibuka. */
  private currentID: number | undefined;

  load(): void {
    this.orgContext.organizationID$(this.route).subscribe((id) => {
      this.currentID = id;
      if (!id) { this.view.setLoading(false); return; }
      this.view.setLoading(true);
      this.orgRepo.get(id).subscribe({
        next: (o) => this.view.setOrganization(o),
        error: () => this.view.setLoading(false),
      });
    });
  }

  save(form: OrganizationProfileFormValue): void {
    const id = this.currentID;
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
