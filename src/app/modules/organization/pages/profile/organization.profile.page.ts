import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { Organization } from '../../entities/organization';
import { OrganizationProfileFormValue, OrganizationProfilePresenter } from './organization.profile.presenter';
import { OrganizationProfileView } from './organization.profile.view';

const emptyForm = (): OrganizationProfileFormValue => ({
  organizationName: '', provinceName: '', cityName: '', contactEmail: '', contactPhone: '', photoURL: '',
});

@Component({
  selector: 'app-organization-profile-page',
  standalone: true,
  templateUrl: './organization.profile.page.html',
  imports: [FormsModule, ImageUploadComponent],
  providers: [OrganizationProfilePresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    /* Diperlebar dari 640px — sebelumnya card terlalu sempit & rata kiri,
       menyisakan banyak ruang kosong di kanan pada layar lebar. */
    .profile-card { max-width: 920px; }
    .identity-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .avatar { width: 64px; height: 64px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; font-size: 1.3rem; }
    img.avatar { object-fit: cover; }
    .photo-upload { max-width: 320px; margin-bottom: 20px; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    @media (max-width: 640px) { .grid-cols-2 { grid-template-columns: 1fr; } }
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

  /** Avatar fallback saat organisasi belum punya foto — inisial dari 2 kata
   *  pertama nama organisasi (pola sama seperti Profil Saya). */
  initials(): string {
    const name = this.organization()?.organizationName ?? '';
    return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  setOrganization(org: Organization): void {
    this.organization.set(org);
    this.form = {
      organizationName: org.organizationName,
      provinceName: org.provinceName ?? '',
      cityName: org.cityName ?? '',
      contactEmail: org.contactEmail ?? '',
      contactPhone: org.contactPhone ?? '',
      photoURL: org.photoURL ?? '',
    };
    this.loading.set(false);
  }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void {}
}
