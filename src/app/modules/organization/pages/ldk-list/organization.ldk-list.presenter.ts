import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { WilayahService } from '../../../../core/services/wilayah.service';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { Organization } from '../../entities/organization';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { SelectOption } from '../../../../shared/select.component';
import { OrganizationLdkListView } from './organization.ldk-list.view';

export interface LdkFormValue {
  organizationName: string;
  organizationCode: string;
  provinceName: string;
  cityName: string;
  contactEmail: string;
  contactPhone: string;
  parentOrganizationID: number | null;
  /** Diedit lewat modul lain (belum ada UI upload di form ini) — cuma
   *  diteruskan apa adanya saat update supaya PUT tidak diam-diam menghapus
   *  photoURL yang sudah ada (organization_repository_impl.go Update()
   *  menulis ulang SELURUH kolom, bukan partial update). */
  photoURL: string;
}

@Injectable()
export class OrganizationLdkListPresenter extends BasePresenter<OrganizationLdkListView> {
  private orgRepo = inject(OrganizationRepository);
  private toast = inject(ToastService);
  private wilayah = inject(WilayahService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param organization list yang sudah ada. `organizationID` (bila
   *  diisi) mempersempit ke anak organisasi Puskomda yang sedang dipilih di
   *  shell cms-puskomda (lihat organization.ldk-list.page.ts, currentPuskomdaID);
   *  kosong (undefined) di shell nasional cms-puskomnas -> seluruh cascade
   *  accessible caller. `parentOrganizationID` dipetakan dari filter combobox
   *  "Puskomda" (hanya ada di config nasional, lihat buildLdkIndexConfig) —
   *  diteruskan sebagai query param terpisah dari organizationID supaya tidak
   *  bentrok dengan penyempitan org-switcher shell Puskomda. Status
   *  multi-select digabung comma-separated, diparse backend lewat
   *  organization_handler_impl.go parseIsActive. */
  list(params: CmsListParams, organizationID?: number): Observable<Pagination<Organization>> {
    const parentOrganizationID = (params.filters['parentOrganizationID'] ?? [])[0];
    return this.orgRepo.list({
      organizationTypeCode: 'LDK',
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      status: params.status.join(','),
      search: (params.filters['search'] ?? [])[0] ?? '',
      organizationID,
      parentOrganizationID: parentOrganizationID ? +parentOrganizationID : undefined,
    });
  }

  loadPuskomdaOptions(): void {
    this.orgRepo.list({ organizationTypeCode: 'PUSKOMDA', limit: 100 }).subscribe({
      next: (p) => this.view.setPuskomdaOptions(p.data.map((o) => ({ value: o.organizationID, label: o.organizationName } as SelectOption))),
      error: () => {},
    });
  }

  /** loadOptions untuk target-pencarian "Puskomda" (mode combobox) di config
   *  nasional — dipanggil sekali oleh CmsIndexComponent saat filter ini
   *  pertama kali dibuka (hasilnya di-cache di sana), sama seperti pola
   *  roleOptions() di user.index.presenter.ts. */
  puskomdaComboOptions(): Observable<CmsComboboxOption[]> {
    return this.orgRepo.list({ organizationTypeCode: 'PUSKOMDA', limit: 100 }).pipe(
      map((p) => p.data.map((o) => ({ id: o.organizationID, label: o.organizationName }))),
    );
  }

  /** Provinsi/Kota-Kabupaten dinamis (wilayah.id) untuk dropdown cascading di
   *  form Tambah/Ubah LDK — lihat organization.ldk-list.page.ts onProvinceChange. */
  loadProvinces(): void {
    this.wilayah.provinces().subscribe({ next: (o) => this.view.setProvinceOptions(o), error: () => {} });
  }
  loadRegencies(provinceId: string): void {
    this.wilayah.regencies(provinceId).subscribe({ next: (o) => this.view.setRegencyOptions(o), error: () => {} });
  }

  save(editId: number | null, form: LdkFormValue): void {
    this.view.setSaving(true);
    if (editId) {
      const body: Record<string, unknown> = {
        organizationName: form.organizationName,
        provinceName: form.provinceName,
        cityName: form.cityName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        photoURL: form.photoURL,
      };
      this.orgRepo.update(editId, body).subscribe({
        next: () => { this.toast.success('LDK berhasil diperbarui'); this.view.setSaving(false); this.view.onSaveSuccess(); },
        error: () => this.view.setSaving(false),
      });
      return;
    }
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
