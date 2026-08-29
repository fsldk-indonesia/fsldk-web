import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { WalletRepository } from '../../repositories/wallet.repository';
import { KantongAmalLedgerHistoryView } from './kantong-amal.ledger-history.view';

@Injectable()
export class KantongAmalLedgerHistoryPresenter extends BasePresenter<KantongAmalLedgerHistoryView> {
  private walletRepo = inject(WalletRepository);

  load(campaignID: number, page: number, limit: number, entryType: string, dateFrom: string, dateTo: string): void {
    this.view.setLoading(true);
    this.walletRepo.myLedger(campaignID, {
      page, limit, entryType: entryType || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
    }).subscribe({
      next: (p) => { this.view.setLedger(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
