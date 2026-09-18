import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { PhoneInputComponent } from '../../../../shared/phone-input.component';
import { IconComponent } from '../../../../shared/icon.component';
import { WilayahService } from '../../../../core/services/wilayah.service';
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
  imports: [FormsModule, ImageUploadComponent, SelectComponent, PhoneInputComponent, IconComponent],
  providers: [OrganizationProfilePresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    /* Dua kolom: identitas+foto (kiri, tetap) di samping form identitas &
       kontak (kanan, 1fr) — mengisi lebar area konten CMS, bukan satu kartu
       sempit sendirian yang menyisakan banyak ruang kosong di kanan. */
    .profile-grid { display: grid; grid-template-columns: minmax(260px, 320px) 1fr; gap: 24px; align-items: start; }
    .profile-side { position: sticky; top: 88px; }
    .profile-main { min-width: 0; }
    @media (max-width: 860px) {
      .profile-grid { grid-template-columns: 1fr; }
      .profile-side { position: static; }
    }
    .identity-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .avatar { width: 64px; height: 64px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; font-size: 1.3rem; }
    img.avatar { object-fit: cover; }
    .photo-upload app-image-upload { display: block; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 28px 0 14px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-section-label:first-of-type { margin-top: 4px; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    @media (max-width: 640px) { .grid-cols-2 { grid-template-columns: 1fr; } }
  `],
})
export class OrganizationProfilePage implements OnInit, OrganizationProfileView {
  private presenter = inject(OrganizationProfilePresenter);
  private wilayah = inject(WilayahService);

  organization = signal<Organization | null>(null);
  loading = signal(true);
  saving = signal(false);
  form: OrganizationProfileFormValue = emptyForm();

  /** id provinsi/kota terpilih di dropdown — HANYA dipakai untuk resolve
   *  label (form.provinceName/cityName) & memicu lookup regencies(); tidak
   *  pernah dikirim ke backend (organization_dto cuma punya kolom nama
   *  bebas, tanpa FK ke wilayah). Data lama yang provinceName/cityName-nya
   *  tidak persis cocok dengan wilayah.id manapun sengaja dibiarkan kosong
   *  di sini (placeholder) — tidak ada fuzzy-matching, lihat komentar di
   *  WilayahService. */
  provinceOptions = signal<SelectOption[]>([]);
  cityOptions = signal<SelectOption[]>([]);
  selectedProvinceID: string | null = null;
  selectedCityID: string | null = null;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
    this.wilayah.provinces().subscribe((options) => this.provinceOptions.set(options));
  }

  onProvinceChange(): void {
    const label = this.provinceOptions().find((o) => o.value === this.selectedProvinceID)?.label ?? '';
    this.form.provinceName = label;
    this.selectedCityID = null;
    this.form.cityName = '';
    this.cityOptions.set([]);
    if (this.selectedProvinceID) {
      this.wilayah.regencies(this.selectedProvinceID).subscribe((options) => this.cityOptions.set(options));
    }
  }

  onCityChange(): void {
    const label = this.cityOptions().find((o) => o.value === this.selectedCityID)?.label ?? '';
    this.form.cityName = label;
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
