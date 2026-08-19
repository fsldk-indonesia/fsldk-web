import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';

/**
 * Layout Landing Page publik: navbar + footer (app-site-header/app-site-footer,
 * shared/ — dipakai identik juga oleh KaderLayoutComponent, lihat miss-
 * development-prompt-2.md poin 4) membingkai konten publik apa adanya.
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    <div class="page-shell">
      <app-site-header />
      <main><router-outlet /></main>
      <app-site-footer />
    </div>
  `,
  styles: [`
    /* Sticky footer klasik: shell jadi flex column setinggi viewport, main
       mengambil sisa ruang (flex:1) supaya footer selalu menempel ke bawah
       walau kontennya pendek (mis. halaman verifikasi email) — sebelumnya
       footer tidak flex-grow sehingga menyisakan celah putih di bawah
       footer pada halaman pendek (miss-development-prompt-2.md poin 3). */
    .page-shell { min-height: 100dvh; display: flex; flex-direction: column; }
    main { flex: 1; }
  `],
})
export class PublicLayoutComponent {}
