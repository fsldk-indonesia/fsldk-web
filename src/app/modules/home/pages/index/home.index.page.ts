import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { News } from '../../../news/entities/news';
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
    .hero { background: linear-gradient(180deg, #ffffff 0%, var(--color-primary-soft) 100%); padding: 80px 0 90px; }
    .hero-badge { display: inline-block; background: #fff; border: 1px solid var(--color-border); color: var(--color-primary-dark); padding: 8px 18px; border-radius: 999px; font-weight: 600; font-size: .85rem; margin-bottom: 24px; }
    .hero-title { font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 800; max-width: 780px; line-height: 1.08; }
    .hero-sub { max-width: 620px; font-size: 1.12rem; color: var(--color-text-secondary); }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow .18s, transform .18s; }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: repeating-linear-gradient(45deg, #eef0ee, #eef0ee 12px, #e8eae8 12px, #e8eae8 24px); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.15rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 0; }

    .hero-about { background: linear-gradient(180deg, #fff, var(--color-primary-soft)); padding: 64px 0; }
    .lead { max-width: 760px; font-size: 1.12rem; color: var(--color-text-secondary); }
    .big { font-size: 1.3rem; font-family: var(--font-heading); font-weight: 600; line-height: 1.4; margin-top: 12px; }
    .mission { margin: 12px 0 0; padding-left: 20px; color: var(--color-text-secondary); }
    .mission li { margin-bottom: 8px; }
    .struktur { background: var(--color-bg-alt); }
    .org { text-align: center; } .big-av { width: 64px; height: 64px; font-size: 1.5rem; margin: 0 auto 14px; }
    .narrow { max-width: 760px; margin: 0 auto; }
  `],
})
export class HomeIndexPage implements OnInit, HomeIndexView {
  private presenter = inject(HomeIndexPresenter);

  news = signal<News[]>([]);
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

  readonly contactEmail = 'info@fsldk-indonesia.com';
  readonly contactInstagram = 'fsldkindonesia';

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setNews(news: News[]): void { this.news.set(news); }
}
