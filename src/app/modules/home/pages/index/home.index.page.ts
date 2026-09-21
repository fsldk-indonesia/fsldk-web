import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { IconComponent } from '../../../../shared/icon.component';
import { WelcomePopupComponent } from '../../components/welcome-popup.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
import { CatalogBook } from '../../../catalogbook/entities/catalog-book';
import { EventListItem } from '../../../event/entities/event';
import { Goods } from '../../../goods/entities/goods';
import { Schedule } from '../../../schedule/entities/schedule';
import { Campaign } from '../../../kantong-amal/entities/campaign';
import { GalleryListItem } from '../../../gallery/entities/gallery';
import { NetworkStats } from '../../../statistic/entities/statistic';
import { statisticPath } from '../../../statistic/statistic.path';
import { contactPath } from '../../../contact/contact.path';
import { catalogbookPath } from '../../../catalogbook/catalogbook.path';
import { eventPath } from '../../../event/event.path';
import { goodsPath } from '../../../goods/goods.path';
import { schedulePath } from '../../../schedule/schedule.path';
import { kantongAmalPath } from '../../../kantong-amal/kantong-amal.path';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { HomeIndexPresenter } from './home.index.presenter';
import { HomeIndexView } from './home.index.view';

Chart.register(...registerables);

interface OrgMember {
  memberName: string;
  position: string;
  level: string;
}

/** Data ringkas untuk preview di bottom sheet mobile (lihat openPreview()) —
 *  satu bentuk generik dipakai lintas tipe kartu (berita/artikel/campaign)
 *  supaya markup sheet-nya cukup satu blok, tidak perlu cabang per tipe. */
interface CardPreview {
  chip: string;
  title: string;
  metaLines: string[];
  link: string[] | string;
  ctaLabel: string;
  progress?: { percent: number; label: string };
}

@Component({
  selector: 'app-home-index-page',
  standalone: true,
  templateUrl: './home.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, WelcomePopupComponent, BottomSheetComponent],
  providers: [HomeIndexPresenter],
  styles: [`
    /* ---------- Kanvas: putih polos di semua section (batik dihilangkan per
       revamp-project prompt) — transisi warna dari hero ditangani khusus oleh
       .section-transition (section pertama setelah hero), dan siluet cahaya
       hijau redup menjelang footer oleh .section-glow (section terakhir
       sebelum footer), bukan lagi motif berulang di semua section. ---------- */
    .section { background: var(--color-bg); position: relative; }

    .section-transition { background: linear-gradient(180deg, var(--color-primary-tint) 0%, var(--color-bg) 100%); }

    .section-glow { overflow: hidden; }
    .section-glow::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(circle 320px at 12% 30%, rgba(0,147,59,.07) 0%, transparent 70%),
        radial-gradient(circle 380px at 88% 75%, rgba(0,147,59,.09) 0%, transparent 70%);
    }
    .section-glow > .container { position: relative; z-index: 1; }

    /* ---------- Hero: dua kolom, latar hangat dua warna (hijau→emas) supaya
       viewport pertama langsung "berbunyi" energic, bukan cuma tint pucat.
       Motif geometris islami modern jadi tekstur, bukan sekadar titik. ---------- */
    .hero { position: relative; background: linear-gradient(122deg, var(--color-primary-tint) 0%, var(--color-primary-soft) 58%, var(--color-gold-soft) 100%); padding: 64px 0 56px; overflow: hidden; }
    .hero-texture {
      position: absolute; inset: 0; opacity: .7; pointer-events: none;
      background-image: radial-gradient(circle, var(--color-primary-soft) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 80% -10px;
      mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
    }
    /* Glow ambient satu ini menggantikan .hero-network::before yang lama —
       dipindah jadi lapisan penuh se-hero (bukan terkurung kotak
       .hero-network yang overflow:hidden) supaya warnanya benar-benar
       menyatu ke gradient .hero sendiri, bukan terlihat "kepotong" di tepi
       kotak grafik jaringan. */
    .hero::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 60% 70% at 78% 60%, var(--color-gold-soft) 0%, var(--color-primary-soft) 40%, transparent 75%);
      opacity: .9;
    }
    .hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1.25fr; gap: 32px; align-items: center; }
    /* hero-copy diberi stacking context sendiri di atas grafik jaringan —
       cegah teks tertutup bila grafik/glow di kolom sebelah melebar. */
    .hero-copy { position: relative; z-index: 2; }
    .hero-badge { display: inline-flex; align-items: center; gap: 9px; background: #fff; border: 1px solid var(--color-gold); color: var(--color-gold-dark); padding: 8px 18px; border-radius: var(--radius-full); font-weight: 700; font-size: .85rem; margin-bottom: 24px; box-shadow: var(--shadow-sm); }
    .hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; animation: node-pulse 2.4s ease-in-out infinite; }
    .hero-title { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -.01em; max-width: 16ch; line-height: 1.12; }
    .hero-title-accent { font-family: var(--font-accent); font-style: italic; font-weight: 600; color: var(--color-primary-dark); }
    .hero-sub { max-width: 46ch; font-size: 1.05rem; color: var(--color-text-secondary); }

    /* ---------- Visual hero "Peta Silaturahmi Nusantara": siluet kepulauan
       Indonesia sungguhan (bukan lagi diagram jaringan abstrak) — Puskomnas
       ditandai persis di Jawa (Yogyakarta, 1986), simpul daerah/LDK tersebar
       di tiap pulau, garis menyala menunjukkan koordinasi yang aktif. Aspek
       rasio svg sengaja lebar (640:240) mengikuti bentang timur-barat
       Nusantara yang sesungguhnya, bukan kotak persegi. ---------- */
    .hero-network { position: relative; z-index: 1; height: 300px; display: flex; align-items: center; justify-content: center; }
    .hero-network-svg { position: relative; z-index: 1; width: 100%; height: 100%; overflow: visible; }
    .island-silhouette { fill: url(#islandFill); stroke: var(--color-primary-bright); stroke-width: 1.3; stroke-linejoin: round; opacity: .95; filter: drop-shadow(0 6px 14px rgba(0,147,59,.22)); }

    /* ---------- Statistik ringkas — hanya angka yang benar-benar bisa
       dipertanggungjawabkan (bukan klaim keanggotaan yang belum terverifikasi). ---------- */
    .stats-strip { padding: 40px 0; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .stat-item { padding-top: 14px; border-top: 2px solid var(--color-primary-soft); }
    .stat-item b { display: block; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--color-primary-dark); }
    .stat-item span { font-size: .85rem; color: var(--color-text-secondary); font-weight: 600; }

    /* ---------- Statistik Jaringan Nasional — ringkasan angka jaringan
       LDK/Puskomda/Puskomnas + satu chart, versi ringkas dari halaman penuh
       /tentang/statistik-jaringan (link "Lihat Selengkapnya" di bawahnya). ---------- */
    .network-stats-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 36px; }
    .network-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; }
    .network-stat-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .network-stat-tile { background: var(--color-bg-warm); border-radius: var(--radius-md); padding: 20px; text-align: center; }
    .network-stat-tile b { display: block; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--color-primary-dark); }
    .network-stat-tile span { font-size: .82rem; color: var(--color-text-secondary); font-weight: 600; }
    .network-chart-wrap { position: relative; height: 260px; }
    .network-stats-more { text-align: center; margin-top: 28px; }
    @media (max-width: 900px) { .network-stats-grid { grid-template-columns: 1fr; } }

    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { position: relative; aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.15rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 0; }

    /* ---------- Book card: siluet rak buku (thumb potret, bukan 16:10 seperti
       kartu berita), rating disematkan sebagai ribbon di sudut sampul. ---------- */
    .book-thumb { aspect-ratio: 3/4; }
    .book-fav {
      position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px;
      background: rgba(255,255,255,.92); color: var(--color-text); font-size: .74rem; font-weight: 700;
      padding: 4px 9px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }
    .book-fav app-icon { color: #e0455f; }

    /* ---------- Goods card: siluet etalase toko (thumb kotak 1:1), harga
       jadi badge mengambang di atas foto, bukan teks polos di bawah judul. ---------- */
    .goods-thumb { aspect-ratio: 1/1; }
    .goods-price-badge {
      position: absolute; left: 10px; bottom: 10px; background: var(--color-primary); color: #fff;
      font-weight: 800; font-size: .85rem; padding: 5px 12px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }

    /* ---------- Campaign card: badge persentase mengambang di foto —
       progres jadi elemen visual utama, bukan cuma baris teks di bawah. ---------- */
    .campaign-badge {
      position: absolute; top: 10px; right: 10px; background: var(--color-gold); color: #fff;
      font-weight: 800; font-size: .85rem; padding: 5px 12px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }

    .progress-track { height: 6px; background: var(--color-primary-soft); border-radius: var(--radius-full); overflow: hidden; margin-top: 12px; }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
    .progress-meta { display: flex; justify-content: space-between; font-size: .8rem; color: var(--color-text-secondary); margin-top: 6px; }

    .agenda-mini-list { display: flex; flex-direction: column; gap: 14px; max-width: 760px; margin: 0 auto; }
    .agenda-mini-item { display: flex; gap: 18px; align-items: flex-start; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 20px; }
    .agenda-mini-date { flex-shrink: 0; width: 56px; text-align: center; border-right: 1px solid var(--color-border); padding-right: 16px; }
    .agenda-mini-date .day { display: block; font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark); }
    .agenda-mini-date .mon { display: block; font-size: .75rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; }
    .agenda-mini-body h3 { margin: 6px 0 4px; font-size: 1.05rem; }

    .contact-cta-inner {
      max-width: 640px; margin: 0 auto; text-align: center; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-sm);
    }
    .contact-cta-inner p { max-width: 46ch; margin: 8px auto 20px; }

    .gallery-card { display: grid; grid-template-columns: 1.1fr 1fr; gap: 0; max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .gallery-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .gallery-thumb { aspect-ratio: 4/3; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-body { padding: 28px; display: flex; flex-direction: column; justify-content: center; }
    .gallery-body h3 { margin: 12px 0 8px; font-size: 1.3rem; }
    .gallery-count { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .85rem; margin-top: 10px; }
    @media (max-width: 640px) { .gallery-card { grid-template-columns: 1fr; } }

    .lead { font-family: var(--font-accent); font-style: italic; font-size: 1.2rem; line-height: 1.5; color: var(--color-text); margin: 0; }
    .big { font-size: 1.3rem; font-weight: 600; line-height: 1.4; margin-top: 12px; }
    .mission { margin: 12px 0 0; padding-left: 20px; color: var(--color-text-secondary); }
    .mission li { margin-bottom: 8px; }
    .org { text-align: center; } .big-av { width: 64px; height: 64px; font-size: 1.5rem; margin: 0 auto 14px; }
    .narrow { max-width: 760px; margin: 0 auto; }

    /* ---------- Tentang Kami: tab terpadu (Tentang/Visi/Misi/Struktur) di
       atas beranda, menggantikan 3 section terpisah — konsepnya mengikuti
       referensi ldksyahid-app (tab pill + logo besar di panel utama). ---------- */
    .tentang-head { margin-bottom: 28px; }
    .tentang-tabs { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
    .tentang-tab {
      display: flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: var(--radius-full);
      border: 1px solid var(--color-border); background: #fff; color: var(--color-text-secondary);
      font-family: var(--font-heading); font-weight: 700; font-size: .88rem; cursor: pointer;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .tentang-tab:hover { color: var(--color-primary-dark); border-color: var(--color-primary-soft); transform: translateY(-1px); }
    .tentang-tab.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; box-shadow: 0 4px 12px rgba(0,147,59,.28); }
    .tentang-panel { max-width: 900px; margin: 0 auto; }
    .tentang-overview { display: flex; align-items: center; gap: 40px; }
    .tentang-big-logo { width: 160px; height: 160px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 10px 24px rgba(0,147,59,.18)); }
    .tentang-visi { text-align: center; padding: 12px 0; }
    .tentang-panel .mission { max-width: 640px; margin: 0 auto; padding-left: 24px; }
    @media (max-width: 720px) { .tentang-overview { flex-direction: column; text-align: center; gap: 20px; } .tentang-big-logo { width: 110px; height: 110px; } }

    /* ---------- CTA: satu-satunya medan hijau penuh di halaman ini (bagian
       dalam kartu saja) — bagian luar tetap memakai kanvas lembut yang sama
       seperti bagian lain, datar tanpa gradasi gelap. ---------- */
    .cta-band { padding-top: 8px; }
    .cta-inner {
      background: var(--color-primary); color: #fff; border-radius: var(--radius-lg); padding: 40px 36px;
      display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
    }
    .cta-inner h2 { color: #fff; margin-bottom: 6px; }
    .cta-btn { background: #fff; color: var(--color-primary-dark); flex-shrink: 0; }
    .cta-btn:hover { background: #fff; color: var(--color-primary-dark); opacity: .92; }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; }
      .hero-network { height: 190px; margin-top: 8px; }
      .hero-network-svg { width: 100%; height: 100%; }
      .stats-row { grid-template-columns: 1fr; gap: 16px; }
      .cta-inner { flex-direction: column; align-items: flex-start; }
    }

    /* ---------- Preview bottom sheet (mobile) — isi generik lintas tipe kartu. ---------- */
    .sheet-title { margin: 10px 0 6px; }
    .sheet-meta-line { margin: 0 0 4px; }
    .sheet-cta { margin-top: 16px; justify-content: center; }

    /* ---------- Card scroller: pengganti .grid.grid-3 KHUSUS di halaman ini
       untuk daftar kartu (berita/artikel/buku/event/goods/campaign) — di
       desktop tampil sebagai grid 3 kolom biasa, di mobile jadi horizontal
       scroll-snap (bukan tumpukan 1 kolom) mengikuti referensi ldksyahid-app.
       Sengaja class terpisah, BUKAN mengubah .grid-3 global di styles.scss,
       supaya halaman/module lain yang reuse .grid-3 tidak ikut berubah. ---------- */
    .card-scroller { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 900px) { .card-scroller { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) {
      .card-scroller {
        display: flex; overflow-x: auto; gap: 14px; padding: 4px 4px 14px; margin: -4px -4px 0;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;
      }
      .card-scroller::-webkit-scrollbar { display: none; }
      .card-scroller > * { flex: 0 0 78%; scroll-snap-align: start; }
    }
  `],
})
export class HomeIndexPage implements OnInit, OnDestroy, HomeIndexView {
  private presenter = inject(HomeIndexPresenter);
  private router = inject(Router);
  private datePipe = new DatePipe('id-ID');

  news = signal<News[]>([]);
  articles = signal<Article[]>([]);
  catalogBooks = signal<CatalogBook[]>([]);
  events = signal<EventListItem[]>([]);
  goods = signal<Goods[]>([]);
  schedules = signal<Schedule[]>([]);
  campaigns = signal<Campaign[]>([]);
  latestGallery = signal<GalleryListItem | null>(null);
  networkStats = signal<NetworkStats | null>(null);
  loading = signal(true);

  private networkLevelChart: Chart | null = null;

  readonly catalogbookPath = catalogbookPath;
  readonly eventPath = eventPath;
  readonly goodsPath = goodsPath;
  readonly schedulePath = schedulePath;
  readonly kantongAmalPath = kantongAmalPath;
  readonly contactPath = contactPath;
  readonly statisticPath = statisticPath;
  readonly formatRupiah = formatRupiah;

  readonly missionList: string[] = [
    'Membangkitkan kembali identitas Islam pada mahasiswa muslim dan masyarakat.',
    'Mengokohkan fikrah dan syariat Islam untuk melahirkan khoiru ummah.',
    'Membangkitkan jiwa nasionalisme dan patriotisme.',
    'Membangun, menjaga, dan mengelola jaringan.',
    'Membangun profesionalitas lembaga.',
    'Membentuk dan mengakselerasi kemuslimahan nasional.',
    'Mewujudkan lembaga yang mandiri secara finansial.',
  ];

  readonly orgStructure: OrgMember[] = [
    { memberName: 'Puskomnas', position: 'Pusat Komunikasi Nasional — LDK koordinator tertinggi FSLDK Indonesia, dipilih dalam FSLDKN untuk masa kerja 2 tahun.', level: 'Nasional' },
    { memberName: 'BK Puskomnas', position: 'Badan Khusus Puskomnas — LDK yang ditunjuk untuk kerja khusus (Hubungan Internasional, Kebangsaan, Kemanusiaan, Kemuslimahan, Kepalestinaan).', level: 'Nasional' },
    { memberName: 'Puskomda', position: 'Pusat Komunikasi Daerah — LDK koordinator FSLDK tingkat daerah, dipilih dalam musyawarah daerah untuk masa kerja 2 tahun.', level: 'Daerah' },
    { memberName: 'LDK', position: 'Lembaga Dakwah Kampus — menaungi aktivitas dakwah Islam secara legal dan formal di perguruan tinggi.', level: 'Kampus' },
    { memberName: 'ADK', position: 'Aktivis Dakwah Kampus — individu muslim berstatus mahasiswa yang berperan dalam aktivitas dakwah kampus.', level: 'Individu' },
    { memberName: 'IKA FSLDK', position: 'Ikatan Keluarga Alumni FSLDK — wadah berhimpun alumni aktivis dakwah kampus.', level: 'Alumni' },
  ];

  readonly foundedYear = 1986;
  readonly yearsSinceFounding = new Date().getFullYear() - this.foundedYear;

  readonly tentangTabs: { key: 'overview' | 'visi' | 'misi' | 'struktur'; icon: string; label: string }[] = [
    { key: 'overview', icon: 'info', label: 'Tentang' },
    { key: 'visi', icon: 'star', label: 'Visi' },
    { key: 'misi', icon: 'list-checks', label: 'Misi' },
    { key: 'struktur', icon: 'sitemap', label: 'Struktur' },
  ];
  activeTentangTab = signal<'overview' | 'visi' | 'misi' | 'struktur'>('overview');

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  ngOnDestroy(): void { this.networkLevelChart?.destroy(); }

  progressPercent(c: Campaign): number {
    return c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0;
  }

  formatDate(d: string | Date | null | undefined): string {
    return d ? (this.datePipe.transform(d, 'd MMM yyyy') ?? '') : '';
  }

  /** Mobile-only preview: klik kartu berita/artikel/campaign membuka bottom
   *  sheet ringkas (bukan langsung pindah halaman) — sesuai revamp-project
   *  prompt poin 9. Desktop tidak diganggu, routerLink jalan seperti biasa. */
  previewSheet = signal<CardPreview | null>(null);

  openPreview(event: Event, preview: CardPreview): void {
    if (window.innerWidth > 720) return;
    event.preventDefault();
    this.previewSheet.set(preview);
  }

  goToPreview(): void {
    const link = this.previewSheet()?.link;
    this.previewSheet.set(null);
    if (!link) return;
    if (Array.isArray(link)) this.router.navigate(link);
    else this.router.navigateByUrl(link);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News[]): void { this.news.set(news); }
  setArticles(articles: Article[]): void { this.articles.set(articles); }
  setCatalogBooks(books: CatalogBook[]): void { this.catalogBooks.set(books); }
  setEvents(events: EventListItem[]): void { this.events.set(events); }
  setGoods(goods: Goods[]): void { this.goods.set(goods); }
  setSchedules(schedules: Schedule[]): void { this.schedules.set(schedules); }
  setCampaigns(campaigns: Campaign[]): void { this.campaigns.set(campaigns); }
  setLatestGallery(gallery: GalleryListItem | null): void { this.latestGallery.set(gallery); }

  setNetworkStats(stats: NetworkStats | null): void {
    this.networkStats.set(stats);
    // Kanvas baru ada di DOM setelah @if di template merender ulang dengan
    // data ini — ditunda satu tick (pola sama dipakai dashboard CMS &
    // statistic.index.page.ts untuk chart Chart.js-nya).
    setTimeout(() => this.renderNetworkChart(stats), 0);
  }

  private renderNetworkChart(stats: NetworkStats | null): void {
    this.networkLevelChart?.destroy();
    this.networkLevelChart = null;
    if (!stats || stats.byLevel.length === 0) return;
    const canvas = document.getElementById('networkLevelChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    this.networkLevelChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: stats.byLevel.map((l) => l.levelLabel),
        datasets: [{ data: stats.byLevel.map((l) => l.count), backgroundColor: ['#00933b', '#00b34d', '#5cd685', '#a7ecc0', '#d7f3e2'] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });
  }
}
