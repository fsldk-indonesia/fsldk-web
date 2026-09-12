import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { StructureRepository } from '../../repositories/structure.repository';
import { Structure } from '../../entities/structure';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { StructureIndexView } from './structure.index.view';

@Injectable()
export class StructureIndexPresenter extends BasePresenter<StructureIndexView> {
  private repo = inject(StructureRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param structure_dto.Filter (filters['search'] dipetakan ke search,
   *  yang mencocokkan angkatan/periode/nama kepengurusan sekaligus di backend). */
  list(params: CmsListParams): Observable<Pagination<Structure>> {
    return this.repo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
    });
  }

  remove(s: Structure): void {
    this.repo.remove(s.structureID).subscribe({
      next: () => { this.toast.success('Data struktur berhasil dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(s.structureID); },
      error: () => this.view.onActionSettled(s.structureID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.repo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} struktur terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
