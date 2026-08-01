import { Component, OnInit, inject, signal } from '@angular/core';
import { OrgMember } from '../../../content/entities/org-member';
import { AboutIndexPresenter } from './about.index.presenter';
import { AboutIndexView } from './about.index.view';

@Component({
  selector: 'app-about-index-page',
  standalone: true,
  templateUrl: './about.index.page.html',
  providers: [AboutIndexPresenter],
  styles: [`
    .hero-about { background: linear-gradient(180deg, #fff, var(--color-primary-soft)); padding: 64px 0; }
    .lead { max-width: 760px; font-size: 1.12rem; color: var(--color-text-secondary); }
    .big { font-size: 1.3rem; font-family: var(--font-heading); font-weight: 600; line-height: 1.4; margin-top: 12px; }
    .mission { margin: 12px 0 0; padding-left: 20px; color: var(--color-text-secondary); }
    .mission li { margin-bottom: 8px; }
    .struktur { background: var(--color-bg-alt); }
    .org { text-align: center; } .big-av { width: 64px; height: 64px; font-size: 1.5rem; margin: 0 auto 14px; }
  `],
})
export class AboutIndexPage implements OnInit, AboutIndexView {
  private presenter = inject(AboutIndexPresenter);

  c = signal<Record<string, string>>({});
  org = signal<OrgMember[]>([]);
  defaultBody = 'Forum Silaturahmi Lembaga Dakwah Kampus (FSLDK) Indonesia adalah forum silaturahmi dan koordinasi antar Lembaga Dakwah Kampus se-Indonesia, didirikan di Yogyakarta pada 25 Mei 1986.';

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  missionList(): string[] {
    const raw = this.c()['about.mission'];
    if (!raw) {
      return [
        'Membangkitkan kembali identitas Islam pada mahasiswa muslim dan masyarakat.',
        'Mengokohkan fikrah dan syariat Islam untuk melahirkan khoiru ummah.',
        'Membangun, menjaga, dan mengelola jaringan FSLDK Indonesia.',
        'Membangun profesionalitas lembaga dan kemandirian finansial.',
      ];
    }
    return raw.split(';').map((s) => s.trim()).filter(Boolean);
  }

  setContent(content: Record<string, string>): void { this.c.set(content); }
  setOrgMembers(members: OrgMember[]): void { this.org.set(members); }
}
