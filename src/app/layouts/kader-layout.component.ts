import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { IconComponent } from '../shared/icon.component';

/**
 * Layout Portal Kader (miss-development-prompt-2.md poin 4): navbar & footer
 * PERSIS landing page (app-site-header/app-site-footer, komponen yang sama
 * dipakai PublicLayoutComponent, bukan varian bertema lain) — satu-satunya
 * beda adalah sidebar menu di antara keduanya. Konten & sidebar memakai
 * palet landing page (hijau brand, motif Kawung), bukan chrome biru/putih
 * gaya CmsLayoutComponent.
 */
@Component({
  selector: 'app-kader-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SiteHeaderComponent, SiteFooterComponent, IconComponent],
  template: `
    <div class="page-shell">
      <app-site-header />
      <div class="kader-body">
        <aside class="sidebar pattern-motif">
          <nav class="side-nav">
            <a routerLink="/kader/ringkasan" routerLinkActive="active">
              <app-icon name="dashboard" [size]="16" /> Ringkasan
            </a>
            <a routerLink="/kader/pendataan" routerLinkActive="active">
              <app-icon name="clipboard-list" [size]="16" /> Formulir Pendataan
            </a>
            <a routerLink="/kader/status" routerLinkActive="active">
              <app-icon name="list-checks" [size]="16" /> Status Pendataan
            </a>
            <a routerLink="/kader/profil" routerLinkActive="active">
              <app-icon name="id-card" [size]="16" /> Profil Saya
            </a>
          </nav>
          <a routerLink="/" class="side-back"><app-icon name="arrow-left" [size]="13" /> Kembali ke Beranda</a>
        </aside>
        <main class="kader-content"><router-outlet /></main>
      </div>
      <app-site-footer />
    </div>
  `,
  styles: [`
    .page-shell { min-height: 100dvh; display: flex; flex-direction: column; }
    .kader-body { flex: 1; display: flex; align-items: flex-start; max-width: 1180px; width: 100%; margin: 0 auto; padding: 32px 20px; gap: 28px; }
    .sidebar {
      width: 240px; flex-shrink: 0; background: linear-gradient(160deg, #fff, var(--color-primary-tint));
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; position: sticky; top: 100px;
    }
    .side-nav { display: flex; flex-direction: column; gap: 4px; }
    .side-nav a { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: .92rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .side-nav a:hover { background: #fff; color: var(--color-text); text-decoration: none; }
    .side-nav a.active { background: var(--color-primary); color: #fff; box-shadow: 0 4px 12px rgba(0,147,59,.25); }
    .side-back { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 10px 12px; color: var(--color-muted); font-weight: 600; font-size: .85rem; }
    .side-back:hover { color: var(--color-primary-dark); text-decoration: none; }
    .kader-content { flex: 1; min-width: 0; }
    @media (max-width: 900px) {
      .kader-body { flex-direction: column; padding: 20px 16px; }
      .sidebar { width: 100%; position: static; }
      .side-nav { flex-direction: row; flex-wrap: wrap; }
    }
  `],
})
export class KaderLayoutComponent {}
