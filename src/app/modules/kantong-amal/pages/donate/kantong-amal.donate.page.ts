import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignDetail } from '../../entities/campaign';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalDonatePresenter } from './kantong-amal.donate.presenter';
import { KantongAmalDonateView } from './kantong-amal.donate.view';

const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

@Component({
  selector: 'app-kantong-amal-donate-page',
  standalone: true,
  templateUrl: './kantong-amal.donate.page.html',
  imports: [RouterLink, FormsModule],
  providers: [KantongAmalDonatePresenter],
  styles: [`
    .layout-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
    @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }
    .form-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 28px; }
    .quick-amounts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0 16px; }
    .quick-amounts button { padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #fff; cursor: pointer; font-size: .88rem; transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease; }
    .quick-amounts button.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 700; }
    .toggle-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
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

  amount: number | null = null;
  customAmount = '';
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

  pickAmount(value: number): void { this.amount = value; this.customAmount = ''; }
  onCustomAmountChange(): void {
    const parsed = Number(this.customAmount.replace(/\D/g, ''));
    this.amount = parsed > 0 ? parsed : null;
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
