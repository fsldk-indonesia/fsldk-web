import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { CampaignLite } from '../../entities/campaign';
import { WalletBalance } from '../../entities/wallet';
import { BankListItem, InquiryResponse, Withdrawal } from '../../entities/withdrawal';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalWithdrawalFormPresenter } from './kantong-amal.withdrawal-form.presenter';
import { KantongAmalWithdrawalFormView } from './kantong-amal.withdrawal-form.view';

@Component({
  selector: 'app-kantong-amal-withdrawal-form-page',
  standalone: true,
  templateUrl: './kantong-amal.withdrawal-form.page.html',
  imports: [RouterLink, FormsModule, UpperCasePipe, SelectComponent],
  providers: [KantongAmalWithdrawalFormPresenter],
  styles: [`
    .page-head { max-width: 640px; margin: 0 auto 24px; }
    .wizard-card { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 28px; }
    .steps { display: flex; gap: 6px; margin-bottom: 24px; }
    .steps span { flex: 1; height: 4px; border-radius: 999px; background: var(--color-bg-alt); }
    .steps span.done { background: var(--color-primary); }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border); font-size: .92rem; }
    .summary-row:last-of-type { border-bottom: none; }
    .summary-row .value { font-weight: 700; }
    .summary-total { font-size: 1.3rem; font-weight: 800; color: var(--color-primary-dark); }
    .result-icon { width: 56px; height: 56px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.6rem; }
  `],
})
export class KantongAmalWithdrawalFormPage implements OnInit, KantongAmalWithdrawalFormView {
  private presenter = inject(KantongAmalWithdrawalFormPresenter);

  campaigns = signal<CampaignLite[]>([]);
  banks = signal<BankListItem[]>([]);
  balance = signal<WalletBalance | null>(null);
  inquiry = signal<InquiryResponse | null>(null);
  loading = signal(true);
  busy = signal(false);
  step = signal(1);
  otpSent = signal(false);
  withdrawal = signal<Withdrawal | null>(null);

  campaignID: number | null = null;
  amount: number | null = null;
  bankCode: string | null = null;
  accountNumber = '';
  password = '';
  otpCode = '';

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  readonly processingEta = '1-3 hari kerja';

  get campaignOptions(): SelectOption[] { return this.campaigns().map((c) => ({ value: c.campaignID, label: c.title })); }
  get bankOptions(): SelectOption[] { return this.banks().map((b) => ({ value: b.bankCode, label: b.name })); }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  onCampaignChange(): void {
    this.balance.set(null);
    if (this.campaignID) this.presenter.loadBalance(this.campaignID);
  }

  netAmount(): number {
    const fee = this.inquiry()?.fee ?? 0;
    return (this.amount ?? 0) - fee;
  }

  /** Tidak ada nominal minimum tetap — cuma perlu >0 dan tidak melebihi saldo
   *  tersedia (biaya transfer dipotong DARI nominal ini, bukan ditambah di
   *  atasnya — lihat netAmount(); persis pola ldksyahid-app WithdrawalController
   *  store(): amount <= available, fee dikurangkan dari amount). */
  canProceedFromAmount(): boolean {
    const bal = this.balance()?.availableBalance ?? 0;
    return !!this.campaignID && !!this.amount && this.amount > 0 && this.amount <= bal;
  }

  goToStep(n: number): void { this.step.set(n); }

  checkAccount(): void {
    if (!this.bankCode || !this.accountNumber || this.busy()) return;
    this.presenter.inquiry({ bankCode: this.bankCode, accountNumber: this.accountNumber });
  }

  submitRequest(): void {
    if (!this.campaignID || !this.canProceedFromAmount() || !this.bankCode || !this.accountNumber || this.busy()) return;
    this.presenter.request(this.campaignID, {
      amount: this.amount!, beneficiaryBankCode: this.bankCode, beneficiaryAccountNumber: this.accountNumber,
      idempotencyKey: crypto.randomUUID(),
    });
  }

  sendOtp(): void {
    const w = this.withdrawal();
    if (!w || this.busy()) return;
    this.presenter.requestOtp(w.withdrawalID);
  }

  submitVerify(): void {
    const w = this.withdrawal();
    if (!w || !this.password || this.busy()) return;
    this.presenter.verify(w.withdrawalID, { password: this.password, otpCode: this.otpCode || undefined });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  setCampaigns(campaigns: CampaignLite[]): void { this.campaigns.set(campaigns); }
  setBanks(banks: BankListItem[]): void { this.banks.set(banks); }
  setBalance(balance: WalletBalance | null): void { this.balance.set(balance); }
  setInquiry(inquiry: InquiryResponse | null): void { this.inquiry.set(inquiry); }

  onRequestSuccess(withdrawal: Withdrawal): void {
    this.withdrawal.set(withdrawal);
    this.step.set(4);
  }

  onOtpSent(): void { this.otpSent.set(true); }

  onVerifySuccess(): void { this.step.set(5); }
}
