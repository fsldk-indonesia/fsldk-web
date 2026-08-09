import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
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
  imports: [RouterLink, DatePipe],
  providers: [HomeIndexPresenter],
  styles: [`
    /* ---------- Kanvas: satu warna latar lembut untuk seluruh halaman,
       kecuali navbar (putih, diatur sendiri), footer (gelap), dan hero
       (tint hijau miliknya sendiri) — sesuai permintaan penyeragaman warna. ---------- */
    .section { background: var(--color-bg-warm); }

    /* ---------- Hero: dua kolom, terang, tekstur titik geometris samar,
       visual berupa komposisi ikon mengambang (bukan foto). ---------- */
    .hero { position: relative; background: var(--color-primary-tint); padding: 56px 0 48px; overflow: hidden; }
    .hero-texture {
      position: absolute; inset: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, var(--color-primary-soft) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 80% -10px;
      mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
    }
    .hero-grid { position: relative; display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; }
    .hero-badge { display: inline-block; background: #fff; border: 1px solid var(--color-border); color: var(--color-ember-dark); padding: 8px 18px; border-radius: var(--radius-full); font-weight: 600; font-size: .85rem; margin-bottom: 24px; }
    .hero-title { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -.01em; max-width: 16ch; line-height: 1.08; }
    .hero-sub { max-width: 46ch; font-size: 1.05rem; color: var(--color-text-secondary); }

    /* ---------- Visual hero: satu komposisi bulat menyatu — logo di pusat,
       cincin orbit tipis, tiga ikon (ukhuwah/dakwah/jaringan) duduk persis
       di atas cincin — bukan lagi elemen-elemen lepas yang tersebar. ---------- */
    .hero-visual { position: relative; height: 320px; display: flex; align-items: center; justify-content: center; }
    .hero-orbit-system { position: relative; width: 290px; height: 290px; }
    .hero-orbit-disc {
      position: absolute; inset: 18px; border-radius: 50%;
      background: radial-gradient(circle at 34% 30%, #fff, var(--color-primary-soft) 78%);
      box-shadow: 0 20px 44px rgba(4,100,40,.12);
    }
    .hero-orbit-ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px dashed var(--color-primary-soft); }
    .hero-orbit-logo {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 200px; height: 200px; display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 14px 26px rgba(4,100,40,.24));
    }
    .hero-orbit-logo img { width: 100%; height: 100%; object-fit: contain; }
    .hero-orbit-node {
      position: absolute; width: 54px; height: 54px; border-radius: 50%; background: #fff;
      display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow);
    }
    /* margin-left dipakai untuk memusatkan secara horizontal (bukan
       transform: translateX) - node ini juga punya class .float-accent, dan
       animasi CSS pada properti transform menimpa seluruhnya, bukan
       digabung, jadi transform statis di sini akan hilang sesaat animasi
       mulai (itulah penyebab glitch-nya). */
    .hero-orbit-node.node-1 { top: -6px; left: 50%; margin-left: -27px; background: var(--color-primary); color: #fff; }
    .hero-orbit-node.node-2 { bottom: 18px; left: -10px; color: var(--color-primary-dark); }
    .hero-orbit-node.node-3 { bottom: 18px; right: -10px; background: var(--color-ember-soft); color: var(--color-ember-dark); }

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
      .hero-visual { height: 240px; margin-top: 8px; }
      .hero-orbit-system { transform: scale(.82); }
      .stats-row { grid-template-columns: 1fr; gap: 16px; }
      .cta-inner { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class HomeIndexPage implements OnInit, HomeIndexView {
  private presenter = inject(HomeIndexPresenter);

  news = signal<News[]>([]);
  articles = signal<Article[]>([]);
  loading = signal(true);

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

  readonly contactEmail = 'fsldkindonesia29@gmail.com';
  readonly contactInstagram = 'fsldkindonesia';

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News[]): void { this.news.set(news); }
  setArticles(articles: Article[]): void { this.articles.set(articles); }
}
