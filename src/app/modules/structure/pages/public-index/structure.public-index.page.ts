import { Component, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';
import { StructureRepository } from '../../repositories/structure.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-structure-public-index',
  standalone: true,
  imports: [IconComponent],
  template: `
    <section class="section">
      <div class="container pb-xl">
        <div class="text-center" style="margin-bottom: 40px">
          <span class="eyebrow">Tentang Kami</span>
          <h1>Struktur Kepengurusan</h1>
          <p class="text-muted" style="max-width: 640px; margin: 8px auto 0">
            Mengenal pengurus dan struktur organisasi FSLDK Indonesia secara lebih dekat.
          </p>
        </div>

        @if (repo.loading()) {
          <div class="empty-state">
            <div class="spinner"></div>
            <p>Memuat data struktur...</p>
          </div>
        } @else if (repo.error()) {
          <div class="empty-state">
            <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
            <h3>Terjadi Kesalahan</h3>
            <p>{{ repo.error() }}</p>
            <button class="btn btn-outline mt-md" (click)="loadData()">Coba Lagi</button>
          </div>
        } @else if (repo.publicStructures().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><app-icon name="sitemap" [size]="48" /></div>
            <h3>Belum ada data struktur</h3>
            <p>Data struktur kepengurusan belum ditambahkan.</p>
          </div>
        } @else {
          <div class="structure-list">
            @for (s of repo.publicStructures(); track s.structureID; let first = $first) {
              <div class="structure-card">
                <div class="structure-card-body">
                  <div class="structure-card-logo">
                    @if (s.logoImage) {
                      <img [src]="imgUrl(s.logoImage)" alt="Logo {{ s.structureName }}">
                    } @else {
                      <div class="placeholder"><app-icon name="image" [size]="48" /></div>
                    }
                  </div>
                  
                  <div class="structure-card-content">
                    <div class="structure-eyebrow">FSLDK Indonesia {{ s.batch }}</div>
                    <h2 class="structure-title">{{ s.structureName }}</h2>
                    
                    <div class="structure-badges">
                      <span class="s-badge s-badge-outline"><app-icon name="calendar-days" [size]="13"/> Masa Amanah {{ s.period }}</span>
                      @if (first) {
                        <span class="s-badge s-badge-gold"><app-icon name="star" [size]="13"/> PENGURUS AKTIF</span>
                      }
                    </div>

                    <div class="structure-desc-title">
                      <app-icon name="info-circle" [size]="14"/> SEKILAS KEPENGURUSAN
                    </div>
                    <div class="structure-desc">
                      <div class="rich-text-display inverse" [innerHTML]="sanitizeHtml(s.structureDescription)"></div>
                    </div>
                  </div>
                  
                  <div class="structure-watermark">{{ s.batch }}</div>
                </div>
                
                @if (s.structureImage) {
                  <details class="structure-chart-accordion">
                    <summary class="chart-summary">
                      <span class="summary-title"><app-icon name="sitemap" [size]="16"/> BAGAN STRUKTUR</span>
                      <app-icon name="chevron-down" [size]="16" class="summary-icon"/>
                    </summary>
                    <div class="chart-content">
                      <a [href]="imgUrl(s.structureImage)" target="_blank" rel="noopener noreferrer" class="chart-img-link" title="Buka gambar ukuran penuh">
                        <img [src]="imgUrl(s.structureImage)" alt="Bagan Struktur {{ s.structureName }}" class="chart-img" loading="lazy">
                        <div class="chart-img-overlay">
                          <app-icon name="zoom-in" [size]="32" />
                        </div>
                      </a>
                    </div>
                  </details>
                }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    /* Wash gradien hijau konsisten dengan halaman artikel, berita, event, katalog, jadwal, dll. */
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }

    .structure-list { display: flex; flex-direction: column; gap: 40px; max-width: 1080px; margin: 0 auto; }
    
    .structure-card { background: var(--color-primary-dark); border-radius: 20px; box-shadow: var(--shadow-lg); overflow: hidden; position: relative; }
    
    .structure-card-body { position: relative; display: flex; gap: 32px; padding: 40px; z-index: 2; overflow: hidden; }
    
    .structure-card-logo { width: 220px; height: 220px; flex-shrink: 0; background: #fff; border-radius: 24px; padding: 12px; box-shadow: var(--shadow); z-index: 2; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .structure-card-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; }
    .structure-card-logo .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-muted); background: var(--color-bg-alt); border-radius: 12px; }
    
    .structure-card-content { flex: 1; z-index: 2; color: #fff; }
    
    .structure-eyebrow { font-size: 0.9rem; font-weight: 800; letter-spacing: 0.02em; color: var(--color-primary-soft); margin-bottom: 8px; }
    .structure-title { font-size: 2.2rem; font-weight: 800; color: #fff; font-family: var(--font-heading); margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.2; }
    
    .structure-badges { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; }
    .s-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; padding: 6px 12px; border-radius: 6px; }
    .s-badge-outline { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
    .s-badge-gold { background: var(--color-gold); color: #fff; }
    
    .structure-desc-title { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
    .structure-desc { font-size: 1.05rem; line-height: 1.7; color: rgba(255,255,255,0.9); }
    ::ng-deep .rich-text-display.inverse p { color: rgba(255,255,255,0.9) !important; margin-bottom: 12px; }
    ::ng-deep .rich-text-display.inverse h1, ::ng-deep .rich-text-display.inverse h2, ::ng-deep .rich-text-display.inverse h3 { color: #fff !important; }
    
    .structure-watermark { position: absolute; right: -20px; bottom: -60px; font-size: 300px; font-weight: 900; line-height: 1; color: rgba(255,255,255,0.03); z-index: 1; user-select: none; pointer-events: none; }
    
    .structure-chart-accordion { background: #fff; border-top: 1px solid rgba(0,0,0,0.05); }
    .chart-summary { display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; cursor: pointer; list-style: none; user-select: none; transition: background 0.2s; }
    .chart-summary::-webkit-details-marker { display: none; }
    .chart-summary:hover { background: var(--color-bg-warm); }
    .summary-title { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 0.95rem; color: var(--color-text-secondary); letter-spacing: 0.02em; }
    .summary-icon { color: var(--color-primary); background: var(--color-primary-soft); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease; }
    
    .structure-chart-accordion[open] .summary-icon { transform: rotate(180deg); }
    .structure-chart-accordion[open] .chart-summary { border-bottom: 1px solid var(--color-border); }
    
    .chart-content { padding: 40px; background: var(--color-bg-warm); }
    
    .chart-img-link { display: block; position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); background: #fff; }
    .chart-img { display: block; width: 100%; height: auto; object-fit: contain; }
    .chart-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; opacity: 0; transition: opacity .2s ease; }
    .chart-img-link:hover .chart-img-overlay { opacity: 1; }
    
    @media (max-width: 900px) {
      .structure-card-body { flex-direction: column; align-items: center; text-align: center; padding: 32px 24px; }
      .structure-badges, .structure-desc-title { justify-content: center; }
      .structure-card-logo { width: 160px; height: 160px; }
      .structure-watermark { font-size: 200px; bottom: 0; right: 0; text-align: center; width: 100%; }
      .chart-summary { padding: 20px 24px; }
      .chart-content { padding: 24px; }
    }
  `]
})
export class StructurePublicIndexPage implements OnInit {
  repo = inject(StructureRepository);
  private title = inject(Title);
  private sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.title.setTitle('Struktur Organisasi - FSLDK Indonesia');
    this.loadData();
  }

  loadData(): void {
    this.repo.loadPublic();
  }

  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
