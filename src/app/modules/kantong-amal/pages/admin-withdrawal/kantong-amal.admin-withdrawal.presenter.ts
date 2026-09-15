import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ToastService } from '../../../../core/services/toast.service';
import { Withdrawal } from '../../entities/withdrawal';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { KantongAmalAdminWithdrawalView } from './kantong-amal.admin-withdrawal.view';

@Injectable()
export class KantongAmalAdminWithdrawalPresenter extends BasePresenter<KantongAmalAdminWithdrawalView> {
  private withdrawalRepo = inject(WithdrawalRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — Status genuinely multi-select
   *  bermakna (backend pakai klausa IN), search mencari ref penarikan &
   *  judul campaign sekaligus. */
  list(params: CmsListParams): Observable<Pagination<Withdrawal>> {
    return this.withdrawalRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
    });
  }

  process(id: number): void {
    this.view.setBusy(id, true);
    this.withdrawalRepo.process(id).subscribe({
      next: () => { this.toast.success('Pencairan diproses'); this.view.onMutated(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
