import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { BankListItem, CreateWithdrawalRequest, InquiryRequest, InquiryResponse, SecurityVerifyRequest, Withdrawal } from '../entities/withdrawal';

/** Panggilan HTTP mentah modul withdrawal — murni CMS/permission-gated sejak
 * revisi 2026-09-01 (tidak ada lagi endpoint milik-sendiri "/me/..."). */
@Injectable({ providedIn: 'root' })
export class WithdrawalApiService {
  private api = inject(ApiService);

  request(campaignID: number, body: CreateWithdrawalRequest): Observable<Withdrawal> { return this.api.post(`/campaigns/${campaignID}/withdrawals`, body); }
  cancel(id: number): Observable<unknown> { return this.api.post(`/withdrawals/${id}/cancel`); }
  requestSecurityOtp(id: number): Observable<unknown> { return this.api.post(`/withdrawals/${id}/security-verify/otp`); }
  verifySecurity(id: number, body: SecurityVerifyRequest): Observable<Withdrawal> { return this.api.post(`/withdrawals/${id}/security-verify`, body); }

  listBanks(): Observable<BankListItem[]> { return this.api.get('/transfer/banks'); }
  inquiry(body: InquiryRequest): Observable<InquiryResponse> { return this.api.post('/transfer/inquiry', body); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Withdrawal>> { return this.api.get('/withdrawals', q); }
  detail(id: number): Observable<Withdrawal> { return this.api.get(`/withdrawals/${id}`); }
  process(id: number): Observable<Withdrawal> { return this.api.post(`/withdrawals/${id}/process`); }
}
