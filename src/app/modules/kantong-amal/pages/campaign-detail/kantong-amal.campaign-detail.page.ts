import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignDetail } from '../../entities/campaign';
import { PublicDonationItem } from '../../entities/donation';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalCampaignDetailPresenter } from './kantong-amal.campaign-detail.presenter';
import { KantongAmalCampaignDetailView } from './kantong-amal.campaign-detail.view';

@Component({
  selector: 'app-kantong-amal-campaign-detail-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-detail.page.html',
  imports: [RouterLink],
  providers: [KantongAmalCampaignDetailPresenter],
  styles: [`
    .layout-grid { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
    @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

    .cover { width: 100%; border-radius: var(--radius-lg); aspect-ratio: 16/9; object-fit: cover; background: var(--color-primary-soft); }
    h1 { margin: 20px 0 8px; font-size: clamp(1.5rem, 3.4vw, 2.1rem); }
    .story { font-size: 1.02rem; line-height: 1.8; color: var(--color-text); white-space: pre-wrap; margin-top: 20px; }

    .side-card { position: sticky; top: 88px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; }
    .progress-track { height: 10px; border-radius: 999px; background: var(--color-bg-alt); overflow: hidden; margin-top: 14px; }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: 999px; }
    .collected { font-size: 1.5rem; font-weight: 800; color: var(--color-primary-dark); margin-top: 14px; }
    .target { font-size: .88rem; color: var(--color-text-secondary); }
    .donate-cta { width: 100%; margin-top: 18px; }

    .donor-list { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
    .donor-item { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--color-border); font-size: .88rem; }
    .donor-item:last-child { border-bottom: none; }
    .donor-name { font-weight: 600; }
    .donor-message { color: var(--color-text-secondary); font-size: .82rem; margin-top: 2px; }
  `],
})
export class KantongAmalCampaignDetailPage implements OnInit, KantongAmalCampaignDetailView {
  private presenter = inject(KantongAmalCampaignDetailPresenter);
  private route = inject(ActivatedRoute);

  campaign = signal<CampaignDetail | null>(null);
  recentDonations = signal<PublicDonationItem[]>([]);
  loading = signal(true);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  progressPercent(): number {
    const c = this.campaign();
    if (!c || c.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100));
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaign(campaign: CampaignDetail | null): void { this.campaign.set(campaign); }
  setRecentDonations(donations: PublicDonationItem[]): void { this.recentDonations.set(donations); }
}
