import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { KantongAmalWithdrawalDetailView } from './kantong-amal.withdrawal-detail.view';

@Injectable()
export class KantongAmalWithdrawalDetailPresenter extends BasePresenter<KantongAmalWithdrawalDetailView> {
  private withdrawalRepo = inject(WithdrawalRepository);

  loadDetail(id: number): void {
    this.view.setLoading(true);
    this.withdrawalRepo.detail(id).subscribe({
      next: (w) => { this.view.setWithdrawal(w); this.view.setLoading(false); },
      error: () => { this.view.setWithdrawal(null); this.view.setLoading(false); },
    });
  }

  /** Dipanggil tiap tick polling — reload seluruh detail (bukan cuma status
   *  ringkas seperti donation.status(), withdrawal tidak punya endpoint
   *  seringan itu dan datanya cukup kecil untuk di-poll utuh). */
  refresh(id: number): void {
    this.withdrawalRepo.detail(id).subscribe({
      next: (w) => this.view.setWithdrawal(w),
      error: () => {},
    });
  }
}
