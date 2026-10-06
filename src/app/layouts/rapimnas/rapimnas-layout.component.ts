import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RapimnasHeaderComponent } from '../../modules/rapimnas/components/rapimnas-header.component';
import { RapimnasFooterComponent } from '../../modules/rapimnas/components/rapimnas-footer.component';
import { RapimnasBackToTopComponent } from '../../modules/rapimnas/components/rapimnas-back-to-top.component';

/**
 * Shell publik khusus Rapimnas — 1:1 dengan layout.tsx referensi (Header +
 * {children} + Footer + BackToTop), TIDAK memakai SiteHeaderComponent/
 * SiteFooterComponent FSLDK (design spec §Layout shell). Mounted di /rapimnas
 * (app.routes.ts, Task 17) sebagai blok top-level SENDIRI — tidak bersarang
 * di bawah PublicLayoutComponent, tidak menyentuh CmsLayoutComponent/
 * KaderLayoutComponent sama sekali.
 *
 * Variabel --rp-* di bawah adalah satu-satunya sumber warna palet referensi
 * (identik dengan :root di globals.css Next.js-nya) — custom property CSS
 * MEWARIS lintas batas view-encapsulation Angular (beda dari class selector
 * biasa), jadi Header/Footer/BackToTop/Countdown/Rundown/6 halaman publik
 * semuanya bisa pakai var(--rp-maroon) dkk tanpa import stylesheet bersama.
 */
@Component({
  selector: 'app-rapimnas-layout',
  standalone: true,
  imports: [RouterOutlet, RapimnasHeaderComponent, RapimnasFooterComponent, RapimnasBackToTopComponent],
  template: `
    <div class="rapimnas-shell">
      <app-rapimnas-header />
      <main class="rapimnas-main"><router-outlet /></main>
      <app-rapimnas-footer />
      <app-rapimnas-back-to-top />
    </div>
  `,
  styles: [`
    .rapimnas-shell {
      --rp-merah: #b70f3c; --rp-maroon: #7d0526; --rp-krem: #ede5bf;
      --rp-oranye: #fe7002; --rp-kuning: #fce043; --rp-bg: #3d0212;
      min-height: 100dvh; background: var(--rp-bg); color: var(--rp-krem);
      font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden;
    }
    .rapimnas-main { display: block; padding-top: 73px; }
  `],
})
export class RapimnasLayoutComponent implements OnInit, OnDestroy {
  private document = inject(DOCUMENT);
  private originalFaviconHref: string | null = null;

  ngOnInit(): void {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      this.originalFaviconHref = link.href;
      link.href = 'assets/rapimnas/logo-rapimnas.png';
    }
  }

  ngOnDestroy(): void {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && this.originalFaviconHref) {
      link.href = this.originalFaviconHref;
    }
  }
}
