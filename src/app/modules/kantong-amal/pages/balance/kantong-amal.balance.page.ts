import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignDetail } from '../../entities/campaign';
import { WalletBalance } from '../../entities/wallet';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalBalancePresenter } from './kantong-amal.balance.presenter';
import { KantongAmalBalanceView } from './kantong-amal.balance.view';

@Component({
  selector: 'app-kantong-amal-balance-page',
  standalone: true,
  templateUrl: './kantong-amal.balance.page.html',
  imports: [RouterLink],
  providers: [KantongAmalBalancePresenter],
  styles: [`
    .page-head { max-width: 820px; margin: 0 auto 24px; }
    .balance-grid { max-width: 820px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .balance-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 22px; }
    .balance-card .label { font-size: .82rem; color: var(--color-text-secondary); }
    .balance-card .value { font-size: 1.5rem; font-weight: 800; margin-top: 6px; }
    .balance-card.primary { grid-column: 1 / -1; background: var(--color-primary-soft); }
    .balance-card.primary .value { color: var(--color-primary-dark); font-size: 2rem; }
    .actions { max-width: 820px; margin: 20px auto 0; display: flex; gap: 10px; }
  `],
})
export class KantongAmalBalancePage implements OnInit, KantongAmalBalanceView {
  private presenter = inject(KantongAmalBalancePresenter);
  private route = inject(ActivatedRoute);

  campaign = signal<CampaignDetail | null>(null);
  balance = signal<WalletBalance | null>(null);
  loading = signal(true);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  private campaignID = 0;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.campaignID = Number(this.route.snapshot.paramMap.get('id'));
    this.presenter.load(this.campaignID);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaign(campaign: CampaignDetail | null): void { this.campaign.set(campaign); }
  setBalance(balance: WalletBalance | null): void { this.balance.set(balance); }
}
