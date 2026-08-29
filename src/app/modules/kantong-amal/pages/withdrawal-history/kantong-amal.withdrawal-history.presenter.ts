import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { KantongAmalWithdrawalHistoryView } from './kantong-amal.withdrawal-history.view';

// GET /me/withdrawals tidak punya filter campaignID di backend (mengembalikan
// seluruh withdrawal milik user lintas campaign) — di-filter di sini per
// campaignID. limit besar cukup untuk skala realistis (satu campaign jarang
// punya lebih dari puluhan withdrawal); backend sort terbaru dulu jadi
// halaman ini tetap menampilkan riwayat terbaru meski dipotong limit.
const FETCH_LIMIT = 100;

@Injectable()
export class KantongAmalWithdrawalHistoryPresenter extends BasePresenter<KantongAmalWithdrawalHistoryView> {
  private withdrawalRepo = inject(WithdrawalRepository);

  load(campaignID: number): void {
    this.view.setLoading(true);
    this.withdrawalRepo.myList({ page: 1, limit: FETCH_LIMIT }).subscribe({
      next: (p) => { this.view.setWithdrawals(p.data.filter((w) => w.campaignID === campaignID)); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  cancel(id: number): void {
    this.withdrawalRepo.cancel(id).subscribe({ next: () => this.view.onCancelSuccess(), error: () => {} });
  }
}
