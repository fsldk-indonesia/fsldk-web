import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { OrganizationApiService } from '../services/organization-api.service';
import { AuthRepository } from '../../user/repositories/auth.repository';
import { Pagination } from '../../../core/entities/pagination';
import { Organization, MeOrganization, OrganizationDirectoryEntry } from '../entities/organization';

/**
 * Data organisasi + state dashboard switcher (Section 11.2 TechSpec — switcher
 * bersifat stateless di backend, jadi organizationID "sedang dilihat" murni
 * state UI di sini, tidak pernah mengubah token/sesi). Disuntik langsung oleh
 * layout & halaman lain yang butuh tahu organisasi mana yang sedang aktif.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationRepository {
  private api = inject(OrganizationApiService);
  private auth = inject(AuthRepository);

  readonly accessible = signal<MeOrganization[]>([]);
  private readonly activeID = signal<number | null>(null);
  readonly activeOrganization = computed(() => this.accessible().find((o) => o.organizationID === this.activeID()) ?? null);
  /** Apakah caller punya lebih dari satu organisasi (perlu tampilkan switcher). */
  readonly hasMultiple = computed(() => this.accessible().length > 1);

  loadAccessible(): Observable<MeOrganization[]> {
    return this.api.me().pipe(
      tap((list) => {
        this.accessible.set(list);
        if (this.activeID() === null || !list.some((o) => o.organizationID === this.activeID())) {
          const home = this.auth.user()?.organizationID;
          const initial = list.find((o) => o.organizationID === home) ?? list[0] ?? null;
          this.activeID.set(initial?.organizationID ?? null);
        }
      }),
    );
  }

  setActive(id: number): void {
    this.activeID.set(id);
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
