import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../../../shared/icon.component';
import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
import { CatalogBook } from '../../../catalogbook/entities/catalog-book';
import { EventListItem } from '../../../event/entities/event';
import { Goods } from '../../../goods/entities/goods';
import { Schedule } from '../../../schedule/entities/schedule';
import { Campaign } from '../../../kantong-amal/entities/campaign';
import { catalogbookPath } from '../../../catalogbook/catalogbook.path';
import { eventPath } from '../../../event/event.path';
import { goodsPath } from '../../../goods/goods.path';
import { schedulePath } from '../../../schedule/schedule.path';
import { kantongAmalPath } from '../../../kantong-amal/kantong-amal.path';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { HomeIndexPresenter } from './home.index.presenter';
import { HomeIndexView } from './home.index.view';

interface OrgMember {
  memberName: string;
  position: string;
  level: string;
}

@Component({
  selector: 'app-home-index-page',
  standalone: true,
  templateUrl: './home.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent],
  providers: [HomeIndexPresenter],
  styles: [`
    /* ---------- Kanvas: satu warna latar lembut + motif batik Kawung yang
       sama dipakai konsisten di SEMUA section polos di beranda (bukan lagi
       flat color kosong), kecuali navbar (putih), footer (gelap, motifnya
       sendiri via .pattern-motif-dark), dan hero (tint hijau→emas). Motif
       ini identik dengan .pattern-motif di styles.scss global — opacity-nya
       dibakar langsung di SVG (stroke-opacity) karena di sini dipakai sebagai
       background-image langsung, bukan lewat ::before terpisah. ---------- */
    .section {
      background-color: var(--color-bg-warm);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%2300933b' stroke-width='1' stroke-opacity='.035'%3E%3Cellipse cx='24' cy='12' rx='6' ry='10'/%3E%3Cellipse cx='24' cy='36' rx='6' ry='10'/%3E%3Cellipse cx='36' cy='24' rx='10' ry='6'/%3E%3Cellipse cx='12' cy='24' rx='10' ry='6'/%3E%3Ccircle cx='24' cy='24' r='2.4' fill='%2300933b' fill-opacity='.035' stroke='none'/%3E%3C/g%3E%3C/svg%3E");
      background-size: 48px 48px;
    }

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
    .hero-grid { position: relative; display: grid; grid-template-columns: 1fr 1.25fr; gap: 32px; align-items: center; }
    /* hero-copy diberi stacking context sendiri di atas grafik jaringan —
       cegah teks tertutup bila grafik/glow di kolom sebelah melebar. */
    .hero-copy { position: relative; z-index: 2; }
    .hero-badge { display: inline-flex; align-items: center; gap: 9px; background: #fff; border: 1px solid var(--color-gold); color: var(--color-gold-dark); padding: 8px 18px; border-radius: var(--radius-full); font-weight: 700; font-size: .85rem; margin-bottom: 24px; box-shadow: var(--shadow-sm); }
    .hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; animation: node-pulse 2.4s ease-in-out infinite; }
    .hero-title { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -.01em; max-width: 16ch; line-height: 1.08; }
    .hero-sub { max-width: 46ch; font-size: 1.05rem; color: var(--color-text-secondary); }

    /* ---------- Visual hero "Peta Silaturahmi Nusantara": siluet kepulauan
       Indonesia sungguhan (bukan lagi diagram jaringan abstrak) — Puskomnas
       ditandai persis di Jawa (Yogyakarta, 1986), simpul daerah/LDK tersebar
       di tiap pulau, garis menyala menunjukkan koordinasi yang aktif. Aspek
       rasio svg sengaja lebar (640:240) mengikuti bentang timur-barat
       Nusantara yang sesungguhnya, bukan kotak persegi. ---------- */
    .hero-network { position: relative; z-index: 1; height: 300px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .hero-network::before {
      content: ""; position: absolute; inset: -4%; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse at 38% 78%, var(--color-gold-soft) 0%, var(--color-primary-soft) 45%, transparent 72%);
      opacity: .85;
    }
    .hero-network-svg { position: relative; z-index: 1; width: 100%; height: 100%; overflow: visible; }
    .island-silhouette { fill: var(--color-primary-soft); stroke: var(--color-primary-bright); stroke-width: 1.3; stroke-linejoin: round; opacity: .95; }
    .hero-network-badge {
      position: absolute; bottom: 4px; left: 8px; top: auto; z-index: 2; display: flex; align-items: center; gap: 10px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full);
      padding: 6px 16px 6px 6px; box-shadow: var(--shadow); font-size: .78rem; font-weight: 700;
      color: var(--color-text); line-height: 1.3; animation: float-y 5s ease-in-out infinite;
    }
    .hero-network-badge img { width: 30px; height: 30px; object-fit: contain; border-radius: 50%; background: var(--color-primary-soft); padding: 4px; }
    .hero-network-badge small { font-weight: 600; color: var(--color-muted); }

    /* ---------- Statistik ringkas — hanya angka yang benar-benar bisa
       dipertanggungjawabkan (bukan klaim keanggotaan yang belum terverifikasi). ---------- */
    .stats-strip { padding: 40px 0; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .stat-item { padding-top: 14px; border-top: 2px solid var(--color-primary-soft); }
    .stat-item b { display: block; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--color-primary-dark); }
    .stat-item span { font-size: .85rem; color: var(--color-text-secondary); font-weight: 600; }

    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.15rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 0; }

    .fav { display: inline-flex; align-items: center; gap: 4px; color: var(--color-muted); font-size: .8rem; margin-top: 8px; }
    .goods-price { font-weight: 700; color: var(--color-primary-dark); margin: 4px 0 0; }

    .progress-track { height: 6px; background: var(--color-primary-soft); border-radius: var(--radius-full); overflow: hidden; margin-top: 12px; }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
    .progress-meta { display: flex; justify-content: space-between; font-size: .8rem; color: var(--color-text-secondary); margin-top: 6px; }

    .agenda-mini-list { display: flex; flex-direction: column; gap: 14px; max-width: 760px; margin: 0 auto; }
    .agenda-mini-item { display: flex; gap: 18px; align-items: flex-start; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 20px; }
    .agenda-mini-date { flex-shrink: 0; width: 56px; text-align: center; border-right: 1px solid var(--color-border); padding-right: 16px; }
    .agenda-mini-date .day { display: block; font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark); }
    .agenda-mini-date .mon { display: block; font-size: .75rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; }
    .agenda-mini-body h3 { margin: 6px 0 4px; font-size: 1.05rem; }

    .hero-about { padding: 56px 0 8px; }
    .about-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: 32px; align-items: start; }
    .lead { font-family: var(--font-accent); font-style: italic; font-size: 1.2rem; line-height: 1.5; color: var(--color-text); margin: 0; }
    .big { font-size: 1.3rem; font-weight: 600; line-height: 1.4; margin-top: 12px; }
    .mission { margin: 12px 0 0; padding-left: 20px; color: var(--color-text-secondary); }
    .mission li { margin-bottom: 8px; }
    .org { text-align: center; } .big-av { width: 64px; height: 64px; font-size: 1.5rem; margin: 0 auto 14px; }
    .narrow { max-width: 760px; margin: 0 auto; }

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
      .hero-grid, .about-grid { grid-template-columns: 1fr; }
      .hero-network { height: 190px; margin-top: 8px; }
      .hero-network-svg { width: 100%; height: 100%; }
      .stats-row { grid-template-columns: 1fr; gap: 16px; }
      .cta-inner { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class HomeIndexPage implements OnInit, HomeIndexView {
  private presenter = inject(HomeIndexPresenter);

  news = signal<News[]>([]);
  articles = signal<Article[]>([]);
  catalogBooks = signal<CatalogBook[]>([]);
  events = signal<EventListItem[]>([]);
  goods = signal<Goods[]>([]);
  schedules = signal<Schedule[]>([]);
  campaigns = signal<Campaign[]>([]);
  loading = signal(true);

  readonly catalogbookPath = catalogbookPath;
  readonly eventPath = eventPath;
  readonly goodsPath = goodsPath;
  readonly schedulePath = schedulePath;
  readonly kantongAmalPath = kantongAmalPath;
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

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  progressPercent(c: Campaign): number {
    return c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0;
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News[]): void { this.news.set(news); }
  setArticles(articles: Article[]): void { this.articles.set(articles); }
  setCatalogBooks(books: CatalogBook[]): void { this.catalogBooks.set(books); }
  setEvents(events: EventListItem[]): void { this.events.set(events); }
  setGoods(goods: Goods[]): void { this.goods.set(goods); }
  setSchedules(schedules: Schedule[]): void { this.schedules.set(schedules); }
  setCampaigns(campaigns: Campaign[]): void { this.campaigns.set(campaigns); }
}
