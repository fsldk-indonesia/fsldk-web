import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../../role/repositories/role.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { UserRow } from '../../entities/user';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { UserIndexView } from './user.index.view';

export interface UserFormValue {
  fullName: string;
  email: string;
  password: string;
  roleID: number;
  isActive: boolean;
  organizationID: number | null;
  wildcardTierAccess: string[];
}

@Injectable()
export class UserIndexPresenter extends BasePresenter<UserIndexView> {
  private userRepo = inject(UserRepository);
  private roleRepo = inject(RoleRepository);
  private orgRepo = inject(OrganizationRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param user_dto.CMSFilter (filters['name']/['email']/['role']
   *  dipetakan ke search/email/role, lihat user.index.page.ts). */
  list(params: CmsListParams): Observable<Pagination<UserRow>> {
    return this.userRepo.list({
      page: params.page, limit: params.limit, sort: params.sort, status: params.status,
      search: params.filters['name'] ?? '', email: params.filters['email'] ?? '', role: params.filters['role'] ?? '',
    });
  }

  /** loadOptions untuk target-pencarian "Role" (mode combobox) di config
   *  CmsIndexConfig — dipanggil sekali oleh CmsIndexComponent saat kotak
   *  pencarian role difokus pertama kali (hasilnya di-cache di sana). */
  roleOptions(): Observable<CmsComboboxOption[]> {
    return this.roleRepo.list().pipe(map((roles) => roles.map((r) => ({ id: r.roleID, label: r.roleName }))));
  }

  loadRoles(): void {
    this.roleRepo.list().subscribe({ next: (r) => this.view.setRoles(r), error: () => {} });
  }

  /**
   * Organisasi yang di-assign ke akun kini SELALU sebuah LDK, untuk role
   * berjenjang organisasi manapun (LDK Admin, Puskomda Verifikator, Puskomnas
   * Verifikator) — bukan lagi organisasi bertipe campuran (LDK/Puskomda/
   * Puskomnas) yang harus dicocokkan manual dengan role yang dipilih.
   * Cakupan akses Puskomda/Puskomnas diturunkan backend dari rantai induk LDK
   * ini (lihat auth_service_impl.go resolveEffectiveOrg) — dikonfirmasi
   * 2026-08-19: akses ditentukan oleh ROLE, bukan tipe organisasi yang dipilih
   * di sini.
   */
  loadOrganizations(): void {
    this.orgRepo.list({ organizationTypeCode: 'LDK', limit: 200 }).subscribe({
      next: (p) => this.view.setOrganizationOptions(p.data.map((o) => ({
        value: o.organizationID,
        label: o.provinceName ? `${o.organizationName} — ${o.provinceName}` : o.organizationName,
      }))),
      error: () => {},
    });
  }

  save(editId: number | null, form: UserFormValue): void {
    this.view.setSaving(true);
    const body: Record<string, unknown> = {
      fullName: form.fullName, email: form.email, roleID: +form.roleID, isActive: form.isActive,
      organizationID: form.organizationID, wildcardTierAccess: form.wildcardTierAccess,
    };
    if (editId) {
      this.userRepo.update(editId, { ...body, password: form.password }).subscribe({
        next: () => { this.toast.success('Pengguna diperbarui'); this.view.setSaving(false); this.view.onSaveSuccess(); },
        error: () => this.view.setSaving(false),
      });
    } else {
      this.userRepo.create({ ...body, password: form.password }).subscribe({
        next: () => { this.toast.success('Pengguna dibuat'); this.view.setSaving(false); this.view.onSaveSuccess(); },
        error: () => this.view.setSaving(false),
      });
    }
  }

  remove(id: number): void {
    this.userRepo.remove(id).subscribe({
      next: () => { this.toast.success('Pengguna dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.userRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} pengguna terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
