import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { WilayahService } from '../../../../core/services/wilayah.service';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { Organization } from '../../entities/organization';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { OrganizationPuskomdaListView } from './organization.puskomda-list.view';

export interface PuskomdaFormValue {
  organizationName: string;
  organizationCode: string;
  provinceName: string;
  cityName: string;
  contactEmail: string;
  contactPhone: string;
  /** Diedit lewat modul lain (belum ada UI upload di form ini) — cuma
   *  diteruskan apa adanya saat update supaya PUT tidak diam-diam menghapus
   *  photoURL yang sudah ada (organization_repository_impl.go Update()
   *  menulis ulang SELURUH kolom, bukan partial update). */
  photoURL: string;
}

@Injectable()
export class OrganizationPuskomdaListPresenter extends BasePresenter<OrganizationPuskomdaListView> {
  private orgRepo = inject(OrganizationRepository);
  private toast = inject(ToastService);
  private wilayah = inject(WilayahService);

  /** dataSource untuk <app-cms-index> — selalu organizationTypeCode=PUSKOMDA
   *  (halaman ini selalu berada di shell nasional, tidak ada persempitan
   *  organizationID seperti ldk-list). Status multi-select digabung
   *  comma-separated, diparse backend lewat organization_handler_impl.go
   *  parseIsActive. */
  list(params: CmsListParams): Observable<Pagination<Organization>> {
    return this.orgRepo.list({
      organizationTypeCode: 'PUSKOMDA',
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      status: params.status.join(','),
      search: (params.filters['search'] ?? [])[0] ?? '',
    });
  }

  /** Provinsi/Kota-Kabupaten dinamis (wilayah.id) untuk dropdown cascading di
   *  form Tambah/Ubah Puskomda — lihat organization.puskomda-list.page.ts
   *  onProvinceChange. */
  loadProvinces(): void {
    this.wilayah.provinces().subscribe({ next: (o) => this.view.setProvinceOptions(o), error: () => {} });
  }
  loadRegencies(provinceId: string): void {
    this.wilayah.regencies(provinceId).subscribe({ next: (o) => this.view.setRegencyOptions(o), error: () => {} });
  }

  save(editId: number | null, form: PuskomdaFormValue): void {
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
        next: () => { this.toast.success('Puskomda berhasil diperbarui'); this.view.setSaving(false); this.view.onSaveSuccess(); },
        error: () => this.view.setSaving(false),
      });
      return;
    }
    this.orgRepo.create({
      organizationTypeCode: 'PUSKOMDA',
      organizationName: form.organizationName,
      organizationCode: form.organizationCode,
      provinceName: form.provinceName,
      cityName: form.cityName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
    }).subscribe({
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
