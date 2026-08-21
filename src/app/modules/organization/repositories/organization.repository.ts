import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrganizationApiService } from '../services/organization-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Organization, MeOrganization, OrganizationDirectoryEntry } from '../entities/organization';

@Injectable({ providedIn: 'root' })
export class OrganizationRepository {
  private api = inject(OrganizationApiService);

  /**
   * Daftar organisasi untuk context switcher lokal (TechSpec Section 19.6) -
   * dipanggil oleh CmsLayoutComponent di shell cms-ldk/cms-puskomda saja.
   * `organizationTypeCode` WAJIB diisi shell tier saat ini (LDK/PUSKOMDA) —
   * ini yang mencegah LDK ikut muncul saat berada di CMS Puskomda dan
   * sebaliknya (miss-development-prompt-2.md poin 2). `siblingOf` (default):
   * sesama organisasi di bawah parent yang sama dengan organizationID yang
   * sedang dibuka. `q`: search lintas seluruh accessible set caller pada
   * tipe yang sama (mengalahkan siblingOf).
   */
  switcherList(organizationTypeCode: string, siblingOf?: number, q?: string): Observable<MeOrganization[]> {
    return this.api.me(organizationTypeCode, siblingOf, q);
  }

  directory(organizationTypeCode: string): Observable<OrganizationDirectoryEntry[]> { return this.api.directory(organizationTypeCode); }
  list(q: Record<string, unknown>): Observable<Pagination<Organization>> { return this.api.list(q); }
  get(id: number): Observable<Organization> { return this.api.get(id); }
  children(id: number): Observable<Organization[]> { return this.api.children(id); }
  create(body: unknown): Observable<Organization> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Organization> { return this.api.update(id, body); }
  deactivate(id: number): Observable<unknown> { return this.api.deactivate(id); }
  reactivate(id: number): Observable<unknown> { return this.api.reactivate(id); }
}
