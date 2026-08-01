import { Component, OnInit, inject, signal } from '@angular/core';
import { ContentService } from '../../core/services/data.services';

interface OrgMember { memberName: string; position: string; level: string | null; }

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <section class="hero-about">
      <div class="container">
        <span class="eyebrow">Tentang Kami</span>
        <h1>{{ c()['about.title'] || 'Tentang FSLDK Indonesia' }}</h1>
        <p class="lead">{{ c()['about.body'] || defaultBody }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container grid grid-2">
        <div class="card card-pad">
          <span class="eyebrow">Visi</span>
          <p class="big">{{ c()['about.vision'] || 'Terwujudnya sinergi antar LDK se-Indonesia menuju Indonesia madani.' }}</p>
        </div>
        <div class="card card-pad">
          <span class="eyebrow">Misi</span>
          <ul class="mission">
            @for (m of missionList(); track m) { <li>{{ m }}</li> }
          </ul>
        </div>
      </div>
    </section>

    <section class="section struktur">
      <div class="container">
        <div class="text-center" style="margin-bottom:32px"><span class="eyebrow">Struktur Organisasi</span><h2>Jaringan FSLDK Indonesia</h2></div>
        <div class="grid grid-3">
          @for (o of org(); track o.position) {
            <div class="card card-pad org">
              <div class="avatar big-av">{{ o.memberName.charAt(0) }}</div>
              <h3>{{ o.memberName }}</h3>
              <p class="text-muted">{{ o.position }}</p>
              @if (o.level) { <span class="chip chip-green">{{ o.level }}</span> }
            </div>
          }
        </div>
      </div>
    </section>
  `,
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
export class AboutComponent implements OnInit {
  private contentSvc = inject(ContentService);
  c = signal<Record<string, string>>({});
  org = signal<OrgMember[]>([]);
  defaultBody = 'Forum Silaturahmi Lembaga Dakwah Kampus (FSLDK) Indonesia adalah forum silaturahmi dan koordinasi antar Lembaga Dakwah Kampus se-Indonesia, didirikan di Yogyakarta pada 25 Mei 1986.';

  ngOnInit(): void {
    this.contentSvc.profile().subscribe({ next: (c) => this.c.set(c), error: () => {} });
    this.contentSvc.orgStructure().subscribe({ next: (o) => this.org.set(o as OrgMember[]), error: () => {} });
  }

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
}
