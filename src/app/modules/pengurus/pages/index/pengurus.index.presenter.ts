import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { SelectOption } from '../../../../shared/select.component';
import { PengurusEntry } from '../../entities/pengurus';
import { PengurusRepository } from '../../repositories/pengurus.repository';
import { PengurusIndexView } from './pengurus.index.view';

@Injectable()
export class PengurusIndexPresenter extends BasePresenter<PengurusIndexView> {
  private repo = inject(PengurusRepository);
  private toast = inject(ToastService);

  loadAll(): void {
    this.view.setLoading(true);
    this.repo.list().subscribe({
      next: (items) => { this.view.setItems(items); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  /** dataSource untuk <app-cms-index> — GET /pengurus mengembalikan seluruh
   *  scope caller (atau scope yang sudah dipersempit org-switcher lewat
   *  organizationID, lihat PengurusIndexPage.currentOrganizationID) sekaligus
   *  tanpa paginasi backend (lists realistis selalu kecil per-organisasi),
   *  jadi search/filter/sort/limit diterapkan DI SINI secara client-side
   *  alih-alih diteruskan sebagai query param seperti CmsListParams biasanya
   *  dipakai (bandingkan user.index.presenter.ts yang meneruskan
   *  params.search dst. langsung ke backend). */
  list(params: CmsListParams, organizationID?: number): Observable<Pagination<PengurusEntry>> {
    return new Observable<Pagination<PengurusEntry>>((subscriber) => {
      this.repo.list(organizationID).subscribe({
        next: (items) => { subscriber.next(this.paginate(items, params)); subscriber.complete(); },
        error: (err) => subscriber.error(err),
      });
    });
  }

  private paginate(items: PengurusEntry[], params: CmsListParams): Pagination<PengurusEntry> {
    const nameQuery = (params.filters['name']?.[0] ?? '').trim().toLowerCase();
    const emailQuery = (params.filters['email']?.[0] ?? '').trim().toLowerCase();
    const orgQuery = (params.filters['organization']?.[0] ?? '').trim().toLowerCase();
    const roleValues = params.filters['role'] ?? [];

    let filtered = items.filter((item) => {
      const matchesName = !nameQuery || item.fullName.toLowerCase().includes(nameQuery);
      const matchesEmail = !emailQuery || item.email.toLowerCase().includes(emailQuery);
      const matchesOrg = !orgQuery || item.homeOrganizationName.toLowerCase().includes(orgQuery);
      const matchesRole = roleValues.length === 0 || roleValues.includes(item.roleName);
      return matchesName && matchesEmail && matchesOrg && matchesRole;
    });

    const desc = params.sort.startsWith('-');
    const sortKey = (desc ? params.sort.slice(1) : params.sort) as keyof PengurusEntry;
    filtered = [...filtered].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''));
      return desc ? -cmp : cmp;
    });

    const start = (params.page - 1) * params.limit;
    return {
      page: params.page, limit: params.limit, count: filtered.length,
      data: filtered.slice(start, start + params.limit), prev: '', next: '',
    };
  }

  /** loadOptions untuk target-pencarian "Role" (mode combobox) — roleCatalog
   *  dioper dari page (sudah scoped ke tier caller lewat route.data.tier,
   *  sama persis dengan opsi dropdown Aksi per baris), presenter tidak perlu
   *  tahu apa pun soal tier. */
  roleSearchOptions(roleCatalog: SelectOption[]): Observable<CmsComboboxOption[]> {
    return of(roleCatalog.map((r) => ({ id: r.value as string, label: r.label })));
  }

  updateRole(userID: number, roleName: string, onDone?: () => void): void {
    this.view.setBusy(userID);
    this.repo.updateRole(userID, roleName).subscribe({
      next: () => {
        this.toast.success('Role pengurus berhasil diperbarui');
        this.view.setBusy(null);
        this.loadAll();
        onDone?.();
      },
      error: () => this.view.setBusy(null),
    });
  }
}
