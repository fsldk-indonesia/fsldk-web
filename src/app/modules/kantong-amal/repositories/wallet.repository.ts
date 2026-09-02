import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WalletApiService } from '../services/wallet-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { LedgerListItem, WalletBalance } from '../entities/wallet';

@Injectable({ providedIn: 'root' })
export class WalletRepository {
  private api = inject(WalletApiService);

  cmsBalance(campaignID: number): Observable<WalletBalance> { return this.api.cmsBalance(campaignID); }
  cmsLedger(campaignID: number, q: Record<string, unknown>): Observable<Pagination<LedgerListItem>> { return this.api.cmsLedger(campaignID, q); }
}
