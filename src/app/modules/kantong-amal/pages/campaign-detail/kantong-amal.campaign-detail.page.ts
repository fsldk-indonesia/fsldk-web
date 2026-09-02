import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignDetail } from '../../entities/campaign';
import { PublicDonationItem } from '../../entities/donation';
import { IconComponent } from '../../../../shared/icon.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalCampaignDetailPresenter } from './kantong-amal.campaign-detail.presenter';
import { KantongAmalCampaignDetailView } from './kantong-amal.campaign-detail.view';

type DetailTab = 'cerita' | 'update' | 'donatur';
const DONOR_PAGE_SIZE = 5;

@Component({
  selector: 'app-kantong-amal-campaign-detail-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-detail.page.html',
  imports: [RouterLink, IconComponent],
  providers: [KantongAmalCampaignDetailPresenter],
  styles: [`
    .layout-grid { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
    @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

    .cover { width: 100%; border-radius: var(--radius-lg); aspect-ratio: 16/9; object-fit: cover; background: var(--color-primary-soft); }
    h1 { margin: 20px 0 8px; font-size: clamp(1.5rem, 3.4vw, 2.1rem); }

    .side-card { position: sticky; top: 88px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; }
    .progress-track { height: 10px; border-radius: 999px; background: var(--color-bg-alt); overflow: hidden; margin-top: 14px; }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: 999px; }
    .collected { font-size: 1.5rem; font-weight: 800; color: var(--color-primary-dark); margin-top: 14px; }
    .target { font-size: .88rem; color: var(--color-text-secondary); }
    .donate-cta { width: 100%; margin-top: 18px; }

    /* ── Tabs (ala ldksyahid-app: Cerita / Update Terbaru / Donatur) ──── */
    .tabs-wrap { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; margin-top: 28px; }
    /* overflow-y:hidden eksplisit — tanpa ini, overflow-x:auto membuat browser
       otomatis meng-compute overflow-y jadi auto juga (aturan spec CSS2.1 §11.1.1),
       jadi scrollbar vertikal kecil muncul walau kontennya tidak benar-benar
       melebihi tinggi kontainer (hanya beda rounding sub-piksel). */
    .tabs-nav { display: flex; border-bottom: 1px solid var(--color-border); padding: 0 20px; overflow-x: auto; overflow-y: hidden; }
    .tab-btn { position: relative; background: none; border: none; padding: 16px 18px; font-family: var(--font-body); font-size: .9rem; font-weight: 700; color: var(--color-text-secondary); cursor: pointer; white-space: nowrap; transition: color var(--motion-fast) ease; }
    .tab-btn:hover { color: var(--color-text); }
    .tab-btn::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--color-primary); transform: scaleX(0); transition: transform var(--motion-fast) ease; }
    .tab-btn.active { color: var(--color-primary-dark); }
    .tab-btn.active::after { transform: scaleX(1); }
    .tab-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; margin-left: 6px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: .7rem; font-weight: 700; }
    .tab-body { padding: 28px; }

    .story-content { font-size: 1.02rem; line-height: 1.8; color: var(--color-text); }
    .story-content img { max-width: 100%; border-radius: var(--radius-md); margin: 10px 0; }

    .empty-tab { text-align: center; padding: 36px 16px; color: var(--color-muted); }
    .empty-tab app-icon { display: block; margin: 0 auto 12px; opacity: .5; }
    .empty-tab p { margin: 0; font-size: .9rem; }

    .donor-list { display: flex; flex-direction: column; gap: 12px; }
    .donor-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--color-bg-alt); border-radius: var(--radius-md); }
    .donor-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .donor-info { flex: 1; min-width: 0; }
    .donor-name { font-weight: 700; font-size: .9rem; }
    .donor-message { color: var(--color-text-secondary); font-size: .82rem; margin-top: 3px; }
    .donor-amount { white-space: nowrap; font-weight: 700; color: var(--color-primary-dark); font-size: .9rem; }
    .load-more-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 14px; padding: 10px; border: 1.5px solid var(--color-border-strong); border-radius: var(--radius-full); background: none; color: var(--color-primary-dark); font-family: var(--font-body); font-size: .86rem; font-weight: 700; cursor: pointer; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .load-more-btn:hover { background: var(--color-primary-soft); border-color: var(--color-primary); }
  `],
})
export class KantongAmalCampaignDetailPage implements OnInit, KantongAmalCampaignDetailView {
  private presenter = inject(KantongAmalCampaignDetailPresenter);
  private route = inject(ActivatedRoute);

  campaign = signal<CampaignDetail | null>(null);
  recentDonations = signal<PublicDonationItem[]>([]);
  loading = signal(true);

  activeTab = signal<DetailTab>('cerita');
  donorsExpanded = signal(false);

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  /** Fallback tampilan untuk donasi lama yang dibuat sebelum pesan default
   *  diterapkan di backend (donation_service_impl.go messageOrDefault) —
   *  teks persis sama dengan default ldksyahid-app, supaya donasi tanpa
   *  pesan tidak pernah tampil kosong di tab Donatur. */
  readonly defaultDonorMessage = 'Bismillah Semoga Berkah yaaa ! tetap Semangat Semuanya !!';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  setTab(tab: DetailTab): void { this.activeTab.set(tab); }

  visibleDonors(): PublicDonationItem[] {
    const all = this.recentDonations();
    return this.donorsExpanded() ? all : all.slice(0, DONOR_PAGE_SIZE);
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
