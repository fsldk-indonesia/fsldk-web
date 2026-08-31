import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { FinanceFormatRepository } from '../../repositories/financeformat.repository';
import { FinanceFormat } from '../../entities/finance-format';
import { FinanceFormatIndexView } from './financeformat.index.view';

export interface FinanceFormatIndexQuery {
  page: number;
  limit: number;
  search: string;
  formatTypeID: number;
  dateFrom: string;
  dateTo: string;
}

@Injectable()
export class FinanceFormatIndexPresenter extends BasePresenter<FinanceFormatIndexView> {
  private repo = inject(FinanceFormatRepository);
  private toast = inject(ToastService);

  loadTypes(): void {
    this.repo.formatTypes().subscribe({ next: (t) => this.view.setTypes(t), error: () => {} });
  }

  load(q: FinanceFormatIndexQuery): void {
    this.repo.cmsList({
      page: q.page,
      limit: q.limit,
      search: q.search,
      formatTypeID: q.formatTypeID || undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
    }).subscribe({
      next: (p) => this.view.setItems(p.data, p.count),
      error: () => {},
    });
  }

  togglePublish(f: FinanceFormat): void {
    this.repo.publish(f.financeFormatID, !f.isActive).subscribe({
      next: () => {
        this.toast.success(f.isActive ? 'Format dinonaktifkan' : 'Format diaktifkan');
        this.view.onPublishToggleSuccess();
        this.view.onActionSettled(f.financeFormatID);
      },
      error: () => this.view.onActionSettled(f.financeFormatID),
    });
  }

  remove(f: FinanceFormat): void {
    this.repo.remove(f.financeFormatID).subscribe({
      next: () => {
        this.toast.success('Format dihapus');
        this.view.onRemoveSuccess();
        this.view.onActionSettled(f.financeFormatID);
      },
      error: () => this.view.onActionSettled(f.financeFormatID),
    });
  }
}
