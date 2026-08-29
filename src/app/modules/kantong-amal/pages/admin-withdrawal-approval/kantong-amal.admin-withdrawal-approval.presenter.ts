import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { KantongAmalAdminWithdrawalApprovalView } from './kantong-amal.admin-withdrawal-approval.view';

@Injectable()
export class KantongAmalAdminWithdrawalApprovalPresenter extends BasePresenter<KantongAmalAdminWithdrawalApprovalView> {
  private withdrawalRepo = inject(WithdrawalRepository);

  load(page: number, limit: number, status: string): void {
    this.view.setLoading(true);
    this.withdrawalRepo.cmsList({ page, limit, status: status || undefined }).subscribe({
      next: (p) => { this.view.setWithdrawals(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  approve(id: number): void {
    this.view.setBusy(id, true);
    this.withdrawalRepo.approve(id).subscribe({
      next: () => { this.view.setBusy(id, false); this.view.onActionSuccess(); },
      error: () => this.view.setBusy(id, false),
    });
  }

  reject(id: number, reason: string): void {
    this.view.setBusy(id, true);
    this.withdrawalRepo.reject(id, reason).subscribe({
      next: () => { this.view.setBusy(id, false); this.view.onActionSuccess(); },
      error: () => this.view.setBusy(id, false),
    });
  }

  process(id: number): void {
    this.view.setBusy(id, true);
    this.withdrawalRepo.process(id).subscribe({
      next: () => { this.view.setBusy(id, false); this.view.onActionSuccess(); },
      error: () => this.view.setBusy(id, false),
    });
  }
}
