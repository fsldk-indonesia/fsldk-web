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

/**
 * Halaman publik detail Campaign — hero GELAP (gradien hijau tua + tekstur
 * titik + glow emas) disalin PERSIS dari pola Galeri public-detail: cover
 * campaign TIDAK dijadikan background penuh-layar (pelajaran dari Galeri —
 * foto apa adanya yang dibentangkan besar bisa pecah/jelek), melainkan
 * dibingkai kartu kaca di kolom kanan hero (object-fit:contain). Section
 * konten di bawahnya memakai `.detail-main-section` blob-drift yang sama
 * persis dengan index (kam-grid index & detail konsisten satu bahasa visual).
 */
@Component({
  selector: 'app-kantong-amal-campaign-detail-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-detail.page.html',
  imports: [RouterLink, IconComponent],
  providers: [KantongAmalCampaignDetailPresenter],
  styles: [`
    /* ---------- Hero gelap — disalin persis dari Galeri public-detail. ---------- */
    .hero-section {
      position: relative;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
      color: #fff; padding: 64px 0 56px; overflow: hidden;
    }
    .hero-texture {
      position: absolute; inset: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }
    .hero-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%); }

    .hero-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: center; }
    .hero-copy { position: relative; z-index: 2; }
    .hero-badges { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .hero-tag { background: rgba(255,255,255,.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.25); color: #fff; font-size: .8rem; font-weight: 700; padding: 5px 12px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; }
    .hero-org { display: block; font-size: 1.02rem; font-weight: 700; color: var(--color-primary-soft); margin-bottom: 8px; }
    .hero-title { font-size: 2.3rem; font-weight: 900; font-family: var(--font-heading); line-height: 1.25; color: #fff; margin: 0 0 26px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }

    .hero-stats { display: flex; gap: 28px; flex-wrap: wrap; }
    .hero-stat-val { display: block; font-size: 1.5rem; font-weight: 800; color: #fff; }
    .hero-stat-label { display: block; font-size: .76rem; font-weight: 600; color: rgba(255,255,255,.75); margin-top: 2px; }

    .hero-badges, .hero-org, .hero-title, .hero-stats { opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards; }
    .hero-badges { animation-delay: .05s; }
    .hero-org { animation-delay: .12s; }
    .hero-title { animation-delay: .22s; }
    .hero-stats { animation-delay: .35s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .hero-badges, .hero-org, .hero-title, .hero-stats { animation: none; opacity: 1; transform: none; } }

    .hero-visual { position: relative; z-index: 2; display: flex; justify-content: center; }
    .hero-cover-frame {
      position: relative; width: 100%; max-width: 420px; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25); border-radius: 5%;
      padding: 10px; box-sizing: border-box; overflow: hidden; box-shadow: 0 24px 50px rgba(0,0,0,.35);
      opacity: 0; animation: heroCoverIn .7s var(--ease-out) .3s forwards;
    }
    @keyframes heroCoverIn { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .hero-cover-frame { animation: none; opacity: 1; transform: none; } }
    .hero-cover-img { display: block; max-width: 100%; max-height: 340px; width: auto; height: auto; object-fit: contain; border-radius: 5%; }
    .hero-cover-fallback { width: 100%; height: 220px; border-radius: 5%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.06); color: rgba(255,255,255,.6); }
    .hero-cover-percent {
      position: absolute; left: 22px; bottom: 22px; z-index: 2;
      display: inline-flex; align-items: baseline; gap: 2px; background: var(--color-gold); color: #fff;
      font-size: .9rem; font-weight: 800; padding: 6px 13px; border-radius: 999px; box-shadow: var(--shadow-sm);
    }
    .hero-cover-percent small { font-size: .68rem; font-weight: 700; opacity: .9; }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; gap: 28px; }
      .hero-copy { text-align: center; }
      .hero-badges, .hero-stats { justify-content: center; }
      .hero-visual { order: -1; }
      .hero-cover-frame { max-width: 340px; }
    }
    @media (max-width: 640px) { .hero-section { padding: 48px 0 60px; } .hero-title { font-size: 1.6rem; } }

    /* ---------- Kanvas konten — PERSIS .section-blob-drift index (campaign-list). ---------- */
    .detail-main-section { position: relative; overflow: hidden; padding: 48px 0 80px; background: var(--color-primary-tint); }
    .detail-main-section::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 45% at 92% 0%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 72%),
        radial-gradient(ellipse 50% 45% at 4% 28%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 72%);
      opacity: .75; animation: detailBlobDrift 12s ease-in-out infinite alternate;
    }
    .detail-main-section::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom, var(--color-primary-tint) 0, rgba(243,250,245,0) 70px);
    }
    .detail-main-section > .container { position: relative; z-index: 1; }
    @keyframes detailBlobDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(-4%,5%) scale(1.15); } }
    @media (prefers-reduced-motion: reduce) { .detail-main-section::before { animation: none; } }

    .crumb-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: .82rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 20px; }
    .crumb-link { display: inline-flex; align-items: center; gap: 5px; color: inherit; text-decoration: none; white-space: nowrap; }
    .crumb-link:hover { color: var(--color-primary-dark); text-decoration: none; }
    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }
    .crumb-current { color: var(--color-primary-dark); font-weight: 700; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .content-layout { max-width: 1080px; margin: 0 auto; }
    .layout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
    @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

    .detail-card { background: #fff; border-radius: 20px; padding: 32px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }

    /* ── Sidebar donasi — kartu progres + CTA, aksen gradient di kepala. ──── */
    .side-card { position: sticky; top: 24px; overflow: hidden; }
    .side-card-head { margin: -32px -32px 20px; padding: 22px 32px 46px; background: linear-gradient(135deg, var(--color-primary-bright) 0%, var(--color-primary) 100%); color: #fff; }
    .side-card-head .collected-label { display: flex; align-items: center; gap: 6px; font-size: .76rem; font-weight: 700; color: rgba(255,255,255,.85); text-transform: uppercase; letter-spacing: .04em; }
    .side-card-head .collected { font-size: 1.6rem; font-weight: 800; margin-top: 6px; }
    .side-progress-track { height: 10px; border-radius: 999px; background: rgba(255,255,255,.25); overflow: hidden; margin-top: -26px; position: relative; z-index: 1; }
    .side-progress-fill { height: 100%; background: var(--color-gold); border-radius: 999px; }
    .side-progress-row { display: flex; justify-content: space-between; font-size: .82rem; color: var(--color-text-secondary); margin-top: 12px; }
    .side-progress-row strong { color: var(--color-primary-dark); font-weight: 800; }
    .side-stats-row { display: flex; gap: 16px; margin-top: 18px; padding-top: 18px; border-top: 1px dashed var(--color-border); }
    .side-stat { flex: 1; text-align: center; }
    .side-stat-val { display: block; font-size: 1.05rem; font-weight: 800; color: var(--color-primary-dark); }
    .side-stat-label { display: block; font-size: .72rem; color: var(--color-muted); margin-top: 2px; }
    .donate-cta { width: 100%; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .side-hint { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; font-size: .8rem; color: var(--color-text-secondary); }
    .side-hint app-icon { color: var(--color-primary); flex-shrink: 0; margin-top: 1px; }

    /* ── Tabs (ala ldksyahid-app: Cerita / Update Terbaru / Donatur) ──── */
    .tabs-nav { display: flex; border-bottom: 1px solid var(--color-border); margin: -32px -32px 24px; padding: 0 32px; overflow-x: auto; overflow-y: hidden; }
    .tab-btn { position: relative; background: none; border: none; padding: 20px 18px; font-family: var(--font-body); font-size: .9rem; font-weight: 700; color: var(--color-text-secondary); cursor: pointer; white-space: nowrap; transition: color var(--motion-fast) ease; }
    .tab-btn:hover { color: var(--color-text); }
    .tab-btn::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--color-primary); transform: scaleX(0); transition: transform var(--motion-fast) ease; }
    .tab-btn.active { color: var(--color-primary-dark); }
    .tab-btn.active::after { transform: scaleX(1); }
    .tab-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; margin-left: 6px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: .7rem; font-weight: 700; }

    /* ---------- Transisi halus ganti tab — setiap @case di @switch adalah
       elemen DOM baru (Angular membongkar-pasang, bukan sekadar toggle
       display), jadi animasi di root wrapper-nya (.tab-pane) otomatis
       terpicu ulang di SETIAP perpindahan tab, bukan cuma sekali saat
       halaman pertama dimuat. */
    .tab-pane { animation: tabPaneFadeIn .32s var(--ease-out); }
    @keyframes tabPaneFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .tab-pane { animation: none; } }

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

    @media (max-width: 640px) {
      .detail-card { padding: 20px; border-radius: 18px; }
      .tabs-nav { margin: -20px -20px 20px; padding: 0 20px; }
      .side-card-head { margin: -20px -20px 20px; padding: 18px 20px 42px; }
    }
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

  organizationLabel(c: CampaignDetail): string {
    return c.organizationNameOverride || c.organizationName || c.picName;
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
