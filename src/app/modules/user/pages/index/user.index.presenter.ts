import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../../role/repositories/role.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
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

  loadUsers(page: number, limit: number, search: string): void {
    this.userRepo.list({ page, limit, search }).subscribe({
      next: (p) => this.view.setUsers(p.data, p.count),
      error: () => {},
    });
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
}
