import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { FinanceFormatRepository } from '../../repositories/financeformat.repository';
import { FinanceFormat } from '../../entities/finance-format';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { FinanceFormatIndexView } from './financeformat.index.view';

@Injectable()
export class FinanceFormatIndexPresenter extends BasePresenter<FinanceFormatIndexView> {
  private repo = inject(FinanceFormatRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param financeformat_dto.Filter (filters['fileName'] ke search,
   *  filters['category'] ke formatTypeID, status ke isActive). Kategori
   *  memakai mode combobox (loadOptions dinamis) — sama seperti kolom
   *  Kategori di Perpustakaan. */
  list(params: CmsListParams): Observable<Pagination<FinanceFormat>> {
    const status = params.status;
    const isActive = status.length === 1 ? (status[0] === 'active' ? 'true' : 'false') : '';
    return this.repo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['fileName'] ?? [])[0] ?? '',
      formatTypeID: (params.filters['category'] ?? []).join(','),
      isActive,
    });
  }

  /** loadOptions untuk target-pencarian "Kategori" (mode combobox). */
  categoryOptions(): Observable<CmsComboboxOption[]> {
    return this.repo.formatTypes().pipe(map((types) => types.map((t) => ({ id: t.formatTypeID, label: t.formatTypeName }))));
  }

  togglePublish(f: FinanceFormat): void {
    this.repo.publish(f.financeFormatID, !f.isActive).subscribe({
      next: () => { this.toast.success(f.isActive ? 'Format dinonaktifkan' : 'Format diaktifkan'); this.view.onPublishToggleSuccess(f.isActive); this.view.onActionSettled(f.financeFormatID); },
      error: () => this.view.onActionSettled(f.financeFormatID),
    });
  }

  remove(f: FinanceFormat): void {
    this.repo.remove(f.financeFormatID).subscribe({
      next: () => { this.toast.success('Format dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(f.financeFormatID); },
      error: () => this.view.onActionSettled(f.financeFormatID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.repo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} format keuangan terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
