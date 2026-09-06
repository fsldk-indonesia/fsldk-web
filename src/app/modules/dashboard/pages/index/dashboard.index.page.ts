import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { IconComponent } from '../../../../shared/icon.component';
import { StatBarComponent } from '../../../../shared/stat-bar.component';
import { StatTileComponent } from '../../../../shared/stat-tile.component';
import { HadithQuranWidgetComponent } from './hadith-quran-widget.component';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { SUBMISSION_STATUS_LABELS } from '../../../submission/entities/submission';
import { DashboardSummary, LDKSummary, PuskomdaBreakdown, PuskomdaSummary, PuskomnasSummary } from '../../entities/dashboard-summary';
import { DashboardIndexPresenter } from './dashboard.index.presenter';
import { DashboardIndexView } from './dashboard.index.view';

Chart.register(...registerables);

// Palet warna chart mengikuti token warna di styles.scss (--color-primary,
// --color-gold, dst.) — di-hardcode sebagai hex karena Chart.js butuh nilai
// warna langsung, bukan var() CSS (sama seperti pola di
// kantong-amal.admin-reports.page.ts).
const CHART_COLORS = {
  primary: '#00933b',
  primaryBright: '#3dbe6b',
  gold: '#d99a1f',
  ember: '#c1622e',
  info: '#3573a6',
  muted: '#8a978f',
};
const STATUS_BUCKET_LABELS = ['Belum Mengisi', 'Menunggu Verifikasi', 'Perlu Revisi', 'Terverifikasi'];
const STATUS_BUCKET_COLORS = [CHART_COLORS.muted, CHART_COLORS.info, CHART_COLORS.gold, CHART_COLORS.primary];

interface StatTileConfig {
  icon: string;
  label: string;
  value: string | number;
  link: string;
  variant: 'solid' | 'soft' | 'gold' | 'ember' | 'info' | 'danger';
}

// Kutipan motivasi harian bersumber dari Al-Qur'an, hadis masyhur, dan
// pepatah Arab yang umum dikutip — dirotasi di kartu sapaan, terpisah dari
// widget "Hadis & Al-Qur'an Harian" (yang mengambil konten acak dari API).
const DAILY_QUOTES: { text: string; source: string }[] = [
  { text: 'Sesungguhnya bersama kesulitan ada kemudahan.', source: 'QS. Al-Insyirah: 6' },
  { text: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lain.', source: 'HR. Ahmad, Thabrani' },
  { text: 'Barangsiapa bersungguh-sungguh, pasti akan berhasil.', source: 'Man Jadda Wajada — Pepatah Arab' },
  { text: 'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.', source: 'QS. Al-Baqarah: 286' },
  { text: 'Barangsiapa menempuh jalan untuk mencari ilmu, Allah akan mudahkan baginya jalan menuju surga.', source: 'HR. Muslim' },
  { text: 'Jadikanlah sabar dan shalat sebagai penolongmu.', source: 'QS. Al-Baqarah: 153' },
  { text: 'Sebaik-baik kalian adalah yang paling baik akhlaknya.', source: 'HR. Bukhari' },
  { text: 'Waktu itu bagaikan pedang, jika engkau tidak memanfaatkannya maka ia akan memotongmu.', source: 'Imam Syafi\'i' },
  { text: 'Dan hanya kepada Tuhanmulah hendaknya kamu berharap.', source: 'QS. Al-Insyirah: 8' },
];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function toWIB(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

function formatRupiah(value: number): string {
  return 'Rp' + Math.round(value).toLocaleString('id-ID');
}

@Component({
  selector: 'app-dashboard-index-page',
  standalone: true,
  templateUrl: './dashboard.index.page.html',
  imports: [DatePipe, IconComponent, StatBarComponent, StatTileComponent, HadithQuranWidgetComponent],
  providers: [DashboardIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .stat { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
    .stat-with-icon { display: flex; align-items: flex-start; gap: 14px; }
    .stat-label { color: var(--color-text-secondary); font-size: .9rem; } .stat-num { display: block; font-family: var(--font-heading); font-weight: 800; font-size: 2.6rem; margin-top: 8px; }
    .card-section { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); margin-top: 20px; }
    .card-section h3 { margin-bottom: 16px; display: flex; align-items: center; gap: 9px; }
    .notes-list { display: flex; flex-direction: column; gap: 12px; }
    .note-item { padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
    .note-item:last-child { border-bottom: none; padding-bottom: 0; }
    .note-item .note-date { color: var(--color-muted); font-size: .8rem; }
    .breakdown-table { width: 100%; border-collapse: collapse; }
    .breakdown-table th, .breakdown-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    .breakdown-table th { color: var(--color-text-secondary); font-weight: 600; }

    /* ---------- Kartu sapaan + kutipan motivasi ---------- */
    .greeting-card {
      position: relative; overflow: hidden; border-radius: var(--radius-lg); color: #fff; padding: 28px 30px;
      background: linear-gradient(135deg, var(--color-primary-bright) 0%, var(--color-primary) 55%, var(--color-primary-dark) 100%);
      display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .greeting-card::before {
      content: ''; position: absolute; top: -60%; right: -10%; width: 320px; height: 320px;
      background: rgba(255,255,255,.06); border-radius: 50%;
    }
    .greeting-main { position: relative; z-index: 1; max-width: 620px; }
    .greeting-text { font-family: var(--font-heading); font-weight: 800; font-size: 1.5rem; display: flex; align-items: center; gap: 10px; }
    .greeting-quote { margin-top: 10px; font-family: var(--font-accent); font-style: italic; font-size: 1rem; opacity: .95; transition: opacity var(--motion-slow) ease; min-height: 1.5em; }
    .greeting-quote.is-fading { opacity: 0; }
    .greeting-quote .quote-source { display: block; font-style: normal; font-size: .78rem; font-weight: 600; opacity: .8; margin-top: 4px; }
    .greeting-clock { position: relative; z-index: 1; text-align: right; }
    .greeting-clock .clock-time { font-family: 'Courier New', monospace; font-weight: 700; font-size: 2rem; letter-spacing: .03em; }
    .greeting-clock .clock-date { font-size: .85rem; opacity: .9; }

    /* ---------- Grid statistik (Utama) ---------- */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }

    /* ---------- Kotak chart (Chart.js) — LDK/Puskomda/Puskomnas ---------- */
    .chart-box { position: relative; height: 280px; }
    .chart-box.chart-box-tall { height: 320px; }

    @media (max-width: 640px) {
      .greeting-card { padding: 22px; }
      .greeting-text { font-size: 1.2rem; }
      .greeting-clock { text-align: left; }
      .greeting-clock .clock-time { font-size: 1.5rem; }
    }
  `],
})
export class DashboardIndexPage implements OnInit, OnDestroy, DashboardIndexView {
  private presenter = inject(DashboardIndexPresenter);
  private auth = inject(AuthRepository);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  readonly statusLabels = SUBMISSION_STATUS_LABELS;
  readonly currentUser = this.auth.user;

  private clockTick = signal(Date.now());
  private clockTimer?: ReturnType<typeof setInterval>;

  quoteIndex = signal(0);
  quoteFading = signal(false);
  private quoteTimer?: ReturnType<typeof setInterval>;

  private ldkKaderChart: Chart | null = null;
  private puskomdaStatusChart: Chart | null = null;
  private puskomnasStatusChart: Chart | null = null;
  private puskomnasLevelChart: Chart | null = null;
  private puskomnasPerPuskomdaChart: Chart | null = null;

  clockLabel = computed(() => {
    const wib = toWIB(new Date(this.clockTick()));
    return [wib.getHours(), wib.getMinutes(), wib.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  });

  dateLabel = computed(() => {
    const wib = toWIB(new Date(this.clockTick()));
    return `${DAY_NAMES[wib.getDay()]}, ${wib.getDate()} ${MONTH_NAMES[wib.getMonth()]} ${wib.getFullYear()}`;
  });

  greetingLabel = computed(() => {
    const hour = toWIB(new Date(this.clockTick())).getHours();
    const salutation = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
    const name = this.currentUser()?.fullName;
    return name ? `${salutation}, ${name}` : salutation;
  });

  currentQuote = computed(() => DAILY_QUOTES[this.quoteIndex() % DAILY_QUOTES.length]);

  puskomdaMax = computed(() => this.summary()?.puskomda?.totalLDK ?? 0);
  puskomnasMax = computed(() => this.summary()?.puskomnas?.totalLDKNasional ?? 0);
  levelDistMax = computed(() => Math.max(1, ...(this.summary()?.puskomnas?.levelDistribution.map((l) => l.count) ?? [1])));
  perPuskomdaLDKMax = computed(() => Math.max(1, ...(this.summary()?.puskomnas?.perPuskomda.map((p: PuskomdaBreakdown) => p.totalLDK) ?? [1])));

  // Tinggi kanvas bar horizontal "Sebaran per Puskomda" mengikuti jumlah baris
  // data — daftar Puskomda nasional bisa panjang, tinggi tetap akan membuat
  // label saling tumpuk tak terbaca.
  perPuskomdaChartHeight = computed(() => Math.max(220, (this.summary()?.puskomnas?.perPuskomda.length ?? 0) * 34));

  statTiles = computed<StatTileConfig[]>(() => {
    const u = this.summary()?.utama;
    if (!u) return [];
    // Path absolut '/cms/...' (bukan relatif '../...') mengikuti konvensi
    // menuRoute lk_permission yang juga absolut — aman karena s.utama HANYA
    // pernah terisi di shell '/cms' (tier FSLDK, lihat dashboard_service_impl.go).
    const tiles: StatTileConfig[] = [
      { icon: 'users', label: 'Pengguna', value: u.totalUsers, link: '/cms/users', variant: 'solid' },
      { icon: 'shield-check', label: 'Role Pengguna', value: u.totalRoles, link: '/cms/roles', variant: 'soft' },
      { icon: 'newspaper', label: 'Berita', value: u.totalNews, link: '/cms/news', variant: 'gold' },
      { icon: 'file-text', label: 'Artikel', value: u.totalArticles, link: '/cms/articles', variant: 'ember' },
      { icon: 'calendar-days', label: 'Event', value: u.totalEvents, link: '/cms/events', variant: 'info' },
      { icon: 'clock', label: 'Jadwal', value: u.totalSchedules, link: '/cms/schedules', variant: 'solid' },
      { icon: 'images', label: 'Galeri', value: u.totalGalleries, link: '/cms/galleries', variant: 'soft' },
      { icon: 'sitemap', label: 'Struktur Org', value: u.totalStructures, link: '/cms/structures', variant: 'gold' },
      { icon: 'book', label: 'Perpustakaan', value: u.totalCatalogBooks, link: '/cms/catalog-books', variant: 'ember' },
      { icon: 'clipboard-list', label: 'Formulir Dinamis', value: u.totalDynamicForms, link: '/cms/dynamic-forms', variant: 'info' },
      { icon: 'shopping-bag', label: 'Produk Goods', value: u.totalGoodsProducts, link: '/cms/goods/products', variant: 'solid' },
      { icon: 'chart-bar', label: 'Format Laporan Keuangan', value: u.totalFinanceFormats, link: '/cms/finance-formats', variant: 'soft' },
      { icon: 'megaphone', label: 'Campaign Kantong Amal', value: u.totalCampaigns, link: '/cms/kantong-amal/campaigns', variant: 'gold' },
      { icon: 'hand-coins', label: 'Donasi Terkumpul', value: formatRupiah(u.totalDonationCollected), link: '/cms/kantong-amal/donasi', variant: 'ember' },
      { icon: 'message-circle', label: 'Komentar', value: u.totalComments, link: '/cms/comments', variant: 'info' },
      { icon: 'link', label: 'Shortlink', value: u.totalShortlinks, link: '/cms/shortlink/list', variant: 'solid' },
      { icon: 'mail-open', label: 'Subscriber Aktif', value: u.totalSubscribers, link: '/cms/subscribers', variant: 'soft' },
      { icon: 'envelope', label: 'Pesan Kontak Belum Dibaca', value: u.unreadContactMessages, link: '/cms/contact-messages', variant: u.unreadContactMessages > 0 ? 'danger' : 'gold' },
      { icon: 'history', label: 'Antrean Job Tertunda', value: u.pendingJobs, link: '/cms/job-queue', variant: u.pendingJobs > 0 ? 'danger' : 'ember' },
    ];
    return tiles;
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
    this.clockTimer = setInterval(() => this.clockTick.set(Date.now()), 1000);
    this.quoteTimer = setInterval(() => this.rotateQuote(), 14000);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
    clearInterval(this.quoteTimer);
    this.destroyCharts();
  }

  private rotateQuote(): void {
    this.quoteFading.set(true);
    setTimeout(() => {
      this.quoteIndex.update((v) => (v + 1) % DAILY_QUOTES.length);
      this.quoteFading.set(false);
    }, 400);
  }

  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  setSummary(summary: DashboardSummary): void {
    this.summary.set(summary);
    // Kanvas hanya ada di DOM setelah blok @if di atas merender ulang dengan
    // data baru — ditunda satu tick, pola yang sama dipakai
    // kantong-amal.admin-reports.page.ts untuk chart Chart.js-nya.
    setTimeout(() => this.renderCharts(summary), 0);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }

  private destroyCharts(): void {
    this.ldkKaderChart?.destroy(); this.ldkKaderChart = null;
    this.puskomdaStatusChart?.destroy(); this.puskomdaStatusChart = null;
    this.puskomnasStatusChart?.destroy(); this.puskomnasStatusChart = null;
    this.puskomnasLevelChart?.destroy(); this.puskomnasLevelChart = null;
    this.puskomnasPerPuskomdaChart?.destroy(); this.puskomnasPerPuskomdaChart = null;
  }

  private renderCharts(s: DashboardSummary): void {
    this.destroyCharts();
    if (s.ldk) this.renderLdkChart(s.ldk);
    if (s.puskomda) this.renderPuskomdaChart(s.puskomda);
    if (s.puskomnas) this.renderPuskomnasCharts(s.puskomnas);
  }

  private renderLdkChart(ldk: LDKSummary): void {
    if (!ldk.kaderActive && !ldk.kaderPending) return;
    const canvas = document.getElementById('ldkKaderChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    this.ldkKaderChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Kader Aktif', 'Menunggu Persetujuan'],
        datasets: [{ data: [ldk.kaderActive, ldk.kaderPending], backgroundColor: [CHART_COLORS.primary, CHART_COLORS.gold] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });
  }

  private renderPuskomdaChart(p: PuskomdaSummary): void {
    const canvas = document.getElementById('puskomdaStatusChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    this.puskomdaStatusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: STATUS_BUCKET_LABELS,
        datasets: [{ data: [p.belumMengisi, p.menungguVerifikasi, p.perluRevisi, p.terverifikasi], backgroundColor: STATUS_BUCKET_COLORS }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });
  }

  private renderPuskomnasCharts(p: PuskomnasSummary): void {
    const statusCanvas = document.getElementById('puskomnasStatusChart') as HTMLCanvasElement | null;
    if (statusCanvas) {
      this.puskomnasStatusChart = new Chart(statusCanvas, {
        type: 'doughnut',
        data: {
          labels: STATUS_BUCKET_LABELS,
          datasets: [{ data: [p.belumMengisi, p.menungguVerifikasi, p.perluRevisi, p.terverifikasi], backgroundColor: STATUS_BUCKET_COLORS }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
      });
    }

    const levelCanvas = document.getElementById('puskomnasLevelChart') as HTMLCanvasElement | null;
    if (levelCanvas && p.levelDistribution.length) {
      this.puskomnasLevelChart = new Chart(levelCanvas, {
        type: 'bar',
        data: {
          labels: p.levelDistribution.map((l) => l.levelLabel || l.levelCode),
          datasets: [{ label: 'Jumlah LDK', data: p.levelDistribution.map((l) => l.count), backgroundColor: CHART_COLORS.primary, borderRadius: 6 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    const perPuskomdaCanvas = document.getElementById('puskomnasPerPuskomdaChart') as HTMLCanvasElement | null;
    if (perPuskomdaCanvas && p.perPuskomda.length) {
      this.puskomnasPerPuskomdaChart = new Chart(perPuskomdaCanvas, {
        type: 'bar',
        data: {
          labels: p.perPuskomda.map((row) => row.organizationName),
          datasets: [{ label: 'Total LDK', data: p.perPuskomda.map((row) => row.totalLDK), backgroundColor: CHART_COLORS.primaryBright, borderRadius: 6 }],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }
  }
}
