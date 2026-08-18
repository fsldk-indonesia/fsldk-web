import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Organization } from '../../entities/organization';
import { OrganizationProfileFormValue, OrganizationProfilePresenter } from './organization.profile.presenter';
import { OrganizationProfileView } from './organization.profile.view';

const emptyForm = (): OrganizationProfileFormValue => ({
  organizationName: '', provinceName: '', cityName: '', contactEmail: '', contactPhone: '',
});

@Component({
  selector: 'app-organization-profile-page',
  standalone: true,
  templateUrl: './organization.profile.page.html',
  imports: [FormsModule],
  providers: [OrganizationProfilePresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .profile-card { max-width: 640px; }
  `],
})
export class OrganizationProfilePage implements OnInit, OrganizationProfileView {
  private presenter = inject(OrganizationProfilePresenter);

  organization = signal<Organization | null>(null);
  loading = signal(true);
  saving = signal(false);
  form: OrganizationProfileFormValue = emptyForm();

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  save(): void { this.presenter.save(this.form); }

  setOrganization(org: Organization): void {
    this.organization.set(org);
    this.form = {
      organizationName: org.organizationName,
      provinceName: org.provinceName ?? '',
      cityName: org.cityName ?? '',
      contactEmail: org.contactEmail ?? '',
      contactPhone: org.contactPhone ?? '',
    };
    this.loading.set(false);
  }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void {}
}
