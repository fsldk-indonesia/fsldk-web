import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { LedgerListItem, WalletBalance } from '../entities/wallet';

/** Panggilan HTTP mentah modul wallet — CMS saja sejak revisi 2026-09-01
 * (tidak ada lagi endpoint milik-sendiri, balance/ledger self-service
 * digantikan Laporan Kantong Amal). */
@Injectable({ providedIn: 'root' })
export class WalletApiService {
  private api = inject(ApiService);

  cmsBalance(campaignID: number): Observable<WalletBalance> { return this.api.get(`/campaigns/${campaignID}/balance`); }
  cmsLedger(campaignID: number, q: Record<string, unknown>): Observable<Pagination<LedgerListItem>> { return this.api.get(`/campaigns/${campaignID}/ledger`, q); }
}
