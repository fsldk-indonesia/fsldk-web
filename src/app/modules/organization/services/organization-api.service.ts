import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Organization, MeOrganization, OrganizationDirectoryEntry } from '../entities/organization';

/** Panggilan HTTP mentah untuk modul organization (/organizations, /me/organizations). */
@Injectable({ providedIn: 'root' })
export class OrganizationApiService {
  private api = inject(ApiService);

  me(): Observable<MeOrganization[]> { return this.api.get('/me/organizations'); }
  directory(organizationTypeCode: string): Observable<OrganizationDirectoryEntry[]> {
    return this.api.get('/organizations/directory', { organizationTypeCode });
  }
  list(q: Record<string, unknown>): Observable<Pagination<Organization>> { return this.api.get('/organizations', q); }
  get(id: number): Observable<Organization> { return this.api.get(`/organizations/${id}`); }
  children(id: number): Observable<Organization[]> { return this.api.get(`/organizations/${id}/children`); }
  create(body: unknown): Observable<Organization> { return this.api.post('/organizations', body); }
  update(id: number, body: unknown): Observable<Organization> { return this.api.put(`/organizations/${id}`, body); }
  deactivate(id: number): Observable<unknown> { return this.api.post(`/organizations/${id}/deactivate`); }
  reactivate(id: number): Observable<unknown> { return this.api.post(`/organizations/${id}/reactivate`); }
}
