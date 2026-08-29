import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { BankListItem, CreateWithdrawalRequest, InquiryRequest, InquiryResponse, SecurityVerifyRequest, Withdrawal } from '../entities/withdrawal';

/** Panggilan HTTP mentah modul withdrawal — endpoint milik-sendiri saja di fase ini. */
@Injectable({ providedIn: 'root' })
export class WithdrawalApiService {
  private api = inject(ApiService);

  request(campaignID: number, body: CreateWithdrawalRequest): Observable<Withdrawal> { return this.api.post(`/me/campaigns/${campaignID}/withdrawals`, body); }
  myList(q: Record<string, unknown>): Observable<Pagination<Withdrawal>> { return this.api.get('/me/withdrawals', q); }
  cancel(id: number): Observable<unknown> { return this.api.post(`/me/withdrawals/${id}/cancel`); }
  requestSecurityOtp(id: number): Observable<unknown> { return this.api.post(`/me/withdrawals/${id}/security-verify/otp`); }
  verifySecurity(id: number, body: SecurityVerifyRequest): Observable<Withdrawal> { return this.api.post(`/me/withdrawals/${id}/security-verify`, body); }

  listBanks(): Observable<BankListItem[]> { return this.api.get('/transfer/banks'); }
  inquiry(body: InquiryRequest): Observable<InquiryResponse> { return this.api.post('/transfer/inquiry', body); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Withdrawal>> { return this.api.get('/withdrawals', q); }
  approve(id: number): Observable<Withdrawal> { return this.api.post(`/withdrawals/${id}/approve`); }
  reject(id: number, reason: string): Observable<unknown> { return this.api.post(`/withdrawals/${id}/reject`, { reason }); }
  process(id: number): Observable<Withdrawal> { return this.api.post(`/withdrawals/${id}/process`); }
}
