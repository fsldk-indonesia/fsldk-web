import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { LedgerListItem, WalletBalance } from '../entities/wallet';

/** Panggilan HTTP mentah modul wallet — endpoint milik-sendiri saja di fase ini. */
@Injectable({ providedIn: 'root' })
export class WalletApiService {
  private api = inject(ApiService);

  myBalance(campaignID: number): Observable<WalletBalance> { return this.api.get(`/me/campaigns/${campaignID}/balance`); }
  myLedger(campaignID: number, q: Record<string, unknown>): Observable<Pagination<LedgerListItem>> { return this.api.get(`/me/campaigns/${campaignID}/ledger`, q); }
}
