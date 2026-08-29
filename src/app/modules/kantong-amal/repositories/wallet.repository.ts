import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WalletApiService } from '../services/wallet-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { LedgerListItem, WalletBalance } from '../entities/wallet';

@Injectable({ providedIn: 'root' })
export class WalletRepository {
  private api = inject(WalletApiService);

  myBalance(campaignID: number): Observable<WalletBalance> { return this.api.myBalance(campaignID); }
  myLedger(campaignID: number, q: Record<string, unknown>): Observable<Pagination<LedgerListItem>> { return this.api.myLedger(campaignID, q); }
}
