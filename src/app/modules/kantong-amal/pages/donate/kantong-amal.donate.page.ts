import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignDetail } from '../../entities/campaign';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { IconComponent } from '../../../../shared/icon.component';
import { PhoneInputComponent } from '../../../../shared/phone-input.component';
import { KantongAmalDonatePresenter } from './kantong-amal.donate.presenter';
import { KantongAmalDonateView } from './kantong-amal.donate.view';

const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

@Component({
  selector: 'app-kantong-amal-donate-page',
  standalone: true,
  templateUrl: './kantong-amal.donate.page.html',
  imports: [RouterLink, FormsModule, IconComponent, PhoneInputComponent],
  providers: [KantongAmalDonatePresenter],
  styles: [`
    .layout-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
    @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }
    .form-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 28px; }

    .form-section + .form-section { margin-top: 28px; padding-top: 28px; border-top: 1px solid var(--color-border); }
    .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: var(--color-primary-dark); }
    .section-head app-icon { display: inline-flex; }
    .section-head h3 { font-family: var(--font-display); font-size: 1.02rem; font-weight: 700; color: var(--color-text); margin: 0; }

    /* ── Nominal ─────────────────────────────────────────── */
    .amount-input-wrap { display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }
    .amount-input-wrap:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .amount-prefix { padding: 12px 0 12px 14px; font-weight: 700; color: var(--color-muted); font-size: 1.05rem; }
    .amount-input { flex: 1; min-width: 0; border: none; background: transparent; padding: 12px 14px 12px 6px; font-size: 1.05rem; font-weight: 700; color: var(--color-text); font-family: var(--font-body); }
    .amount-input:focus { outline: none; }
    .amount-input::placeholder { font-weight: 400; color: var(--color-muted); }

    .quick-amounts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0 0; }
    .quick-amounts button { padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #fff; cursor: pointer; font-size: .88rem; font-weight: 600; color: var(--color-text-secondary); transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .quick-amounts button:hover { border-color: var(--color-border-strong); }
    .quick-amounts button.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 700; }

    /* ── Fee breakdown ───────────────────────────────────── */
    .fee-breakdown { margin-top: 18px; padding: 14px 16px; background: var(--color-bg-alt); border-radius: var(--radius-sm); }
    .fee-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: .86rem; color: var(--color-text-secondary); padding: 5px 0; }
    .fee-row app-icon { color: var(--color-muted); margin-right: 4px; }
    .fee-row.fee-total { margin-top: 4px; padding-top: 10px; border-top: 1px dashed var(--color-border-strong); font-size: .95rem; font-weight: 700; color: var(--color-text); }

    /* ── Donor / message ─────────────────────────────────── */
    .anon-toggle { display: flex; align-items: center; gap: 10px; margin-top: 16px; cursor: pointer; font-size: .9rem; color: var(--color-text); }
    .anon-hint { display: flex; align-items: flex-start; gap: 6px; margin: 8px 0 0; font-size: .82rem; color: var(--color-text-secondary); background: var(--color-primary-tint); border-radius: var(--radius-sm); padding: 10px 12px; }
    .anon-hint app-icon { color: var(--color-primary); flex-shrink: 0; margin-top: 1px; }

    .side-card { position: sticky; top: 88px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 22px; }
    .side-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 14px; }
  `],
})
export class KantongAmalDonatePage implements OnInit, KantongAmalDonateView {
  private presenter = inject(KantongAmalDonatePresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  campaign = signal<CampaignDetail | null>(null);
  loading = signal(true);
  submitting = signal(false);

  readonly quickAmounts = QUICK_AMOUNTS;
  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  /** Biaya layanan QRIS (BisaTopup) — 1% per transaksi, dibulatkan ke atas.
   *  Harus disamakan dengan BISATOPUP_QRIS_MDR_PERCENT_CROWDFUNDING di fsldk-api
   *  (lihat pkg/bisatopup/mdr.go). Backend yang menghitung ulang nominal final
   *  secara otoritatif — angka di sini hanya estimasi tampilan sebelum submit. */
  readonly FEE_RATE = 0.01;

  amount: number | null = null;
  amountDisplay = '';
  donorName = '';
  donorEmail = '';
  donorPhone = '';
  message = '';
  isAnonymous = false;

  private slug = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.presenter.loadCampaign(this.slug);
  }

  pickAmount(value: number): void {
    this.amount = value;
    this.amountDisplay = this.groupDigits(String(value));
  }

  onAmountInput(raw: string): void {
    const digits = raw.replace(/\D/g, '');
    this.amount = digits ? Number(digits) : null;
    this.amountDisplay = digits ? this.groupDigits(digits) : '';
  }

  private groupDigits(digits: string): string {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /** Total tagihan (gross) — sama persis dengan rumus fsldk-api & ldksyahid-app:
   *  ceil(nominal / (1 - rate)), memastikan campaign menerima persis `amount`
   *  setelah dipotong MDR gateway. */
  grossTotal(): number {
    if (!this.amount) return 0;
    return Math.ceil(this.amount / (1 - this.FEE_RATE));
  }

  adminFee(): number {
    return this.grossTotal() - (this.amount ?? 0);
  }

  canSubmit(): boolean {
    return !!this.amount && this.amount >= 1000 && !!this.donorName && !!this.donorEmail && !!this.donorPhone && !this.submitting();
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.presenter.submit(this.slug, {
      amount: this.amount!,
      donorName: this.donorName,
      donorEmail: this.donorEmail,
      donorPhone: this.donorPhone,
      isAnonymous: this.isAnonymous,
      message: this.message || undefined,
      idempotencyKey: crypto.randomUUID(),
    });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSubmitting(submitting: boolean): void { this.submitting.set(submitting); }
  setCampaign(campaign: CampaignDetail | null): void { this.campaign.set(campaign); }
  onSubmitSuccess(publicRef: string): void { this.router.navigateByUrl(kantongAmalPath.paymentStatus(publicRef)); }
}
