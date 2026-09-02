import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WithdrawalApiService } from '../services/withdrawal-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { BankListItem, CreateWithdrawalRequest, InquiryRequest, InquiryResponse, SecurityVerifyRequest, Withdrawal } from '../entities/withdrawal';

@Injectable({ providedIn: 'root' })
export class WithdrawalRepository {
  private api = inject(WithdrawalApiService);

  request(campaignID: number, body: CreateWithdrawalRequest): Observable<Withdrawal> { return this.api.request(campaignID, body); }
  cancel(id: number): Observable<unknown> { return this.api.cancel(id); }
  requestSecurityOtp(id: number): Observable<unknown> { return this.api.requestSecurityOtp(id); }
  verifySecurity(id: number, body: SecurityVerifyRequest): Observable<Withdrawal> { return this.api.verifySecurity(id, body); }

  listBanks(): Observable<BankListItem[]> { return this.api.listBanks(); }
  inquiry(body: InquiryRequest): Observable<InquiryResponse> { return this.api.inquiry(body); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Withdrawal>> { return this.api.cmsList(q); }
  process(id: number): Observable<Withdrawal> { return this.api.process(id); }
}
