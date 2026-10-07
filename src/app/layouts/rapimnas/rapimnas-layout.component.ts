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
      <div class="rp-bg-texture" aria-hidden="true">
        <div class="rp-bg-dots"></div>
        <div class="rp-bg-glow rp-bg-glow-tl"></div>
        <div class="rp-bg-glow rp-bg-glow-br"></div>
        <svg class="rp-bg-swirl rp-bg-swirl-tl" viewBox="0 0 400 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rpSwirlGradTl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fce043" stop-opacity="0.9" />
              <stop offset="45%" stop-color="#fe7002" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#b70f3c" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g fill="none" stroke-linecap="round">
            <path d="M -30 40 C 70 20, 150 100, 110 200 C 70 300, 180 340, 320 300" stroke="url(#rpSwirlGradTl)" stroke-width="5" opacity="0.85" />
            <path d="M -30 90 C 50 70, 110 150, 80 230 C 50 310, 150 330, 270 280" stroke="url(#rpSwirlGradTl)" stroke-width="2.5" opacity="0.55" />
            <circle cx="150" cy="60" r="2.2" fill="#fce043" opacity="0.8" />
            <circle cx="190" cy="40" r="1.4" fill="#fce043" opacity="0.6" />
            <circle cx="60" cy="150" r="1.8" fill="#fe7002" opacity="0.7" />
            <circle cx="220" cy="90" r="1.2" fill="#fce043" opacity="0.5" />
            <circle cx="30" cy="220" r="1.6" fill="#fe7002" opacity="0.6" />
          </g>
        </svg>
        <svg class="rp-bg-swirl rp-bg-swirl-br" viewBox="0 0 400 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rpSwirlGradBr" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fce043" stop-opacity="0.9" />
              <stop offset="45%" stop-color="#fe7002" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#b70f3c" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g fill="none" stroke-linecap="round">
            <path d="M -30 40 C 70 20, 150 100, 110 200 C 70 300, 180 340, 320 300" stroke="url(#rpSwirlGradBr)" stroke-width="5" opacity="0.85" />
            <path d="M -30 90 C 50 70, 110 150, 80 230 C 50 310, 150 330, 270 280" stroke="url(#rpSwirlGradBr)" stroke-width="2.5" opacity="0.55" />
            <circle cx="150" cy="60" r="2.2" fill="#fce043" opacity="0.8" />
            <circle cx="190" cy="40" r="1.4" fill="#fce043" opacity="0.6" />
            <circle cx="60" cy="150" r="1.8" fill="#fe7002" opacity="0.7" />
            <circle cx="220" cy="90" r="1.2" fill="#fce043" opacity="0.5" />
            <circle cx="30" cy="220" r="1.6" fill="#fe7002" opacity="0.6" />
          </g>
        </svg>
      </div>
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
      position: relative; isolation: isolate;
      min-height: 100dvh; background: var(--rp-bg); color: var(--rp-krem);
      font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden;
    }
    .rapimnas-main { display: block; padding-top: 73px; }

    /* Site-wide halftone-dot + gold-swirl texture matching the event's
       print branding (guidebook cover / promo poster). Absolute (not
       fixed) so it spans the FULL page height and the corner swirls sit
       once at the real top/bottom of the page — position:fixed would
       pin them to the viewport corner at every scroll position, which
       put them permanently behind the fixed header/footer with a hard
       clipped edge instead of appearing once like the print artwork.
       Pinned behind all real content via isolation+negative z-index. */
    .rp-bg-texture {
      position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden;
      /* Keep the very top completely empty (no dots/glow/swirl) so nothing
         peeks through any sub-pixel seam between the fixed header and the
         page content below it, then fade the texture in smoothly after. */
      mask-image: linear-gradient(to bottom, transparent 0, transparent 90px, black 170px);
      -webkit-mask-image: linear-gradient(to bottom, transparent 0, transparent 90px, black 170px);
    }
    .rp-bg-dots {
      position: absolute; inset: -24px;
      background-image: radial-gradient(circle, rgba(252, 224, 67, 0.3) 1.3px, transparent 1.6px);
      background-size: 24px 24px;
      mask-image: radial-gradient(ellipse 72% 58% at 50% 32%, transparent 10%, black 78%);
      -webkit-mask-image: radial-gradient(ellipse 72% 58% at 50% 32%, transparent 10%, black 78%);
    }
    .rp-bg-glow { position: absolute; width: 60vmax; height: 60vmax; border-radius: 50%; filter: blur(80px); }
    .rp-bg-glow-tl { top: -28vmax; left: -28vmax; background: radial-gradient(circle, color-mix(in srgb, var(--rp-oranye) 22%, transparent), transparent 70%); }
    .rp-bg-glow-br { bottom: -28vmax; right: -28vmax; background: radial-gradient(circle, color-mix(in srgb, var(--rp-merah) 26%, transparent), transparent 70%); }
    /* Fade applied in the swirl's own (pre-rotation) local box: transparent
       at local-top, fully revealed by 26% down. For -tl this fades the
       visual top (the edge nearest the header). For -br, the 180deg
       rotation flips this so the SAME rule fades the visual bottom (the
       edge nearest the footer) — so neither swirl presents a hard edge
       where it nears the header/footer band; it tapers to nothing first. */
    .rp-bg-swirl {
      position: absolute; width: 440px; height: 440px; max-width: 55vw; max-height: 55vw;
      mask-image: linear-gradient(to bottom, transparent 0%, black 26%);
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 26%);
    }
    .rp-bg-swirl-tl { top: 0; left: 0; }
    .rp-bg-swirl-br { bottom: 0; right: 0; transform: rotate(180deg); }
  `],
})
export class RapimnasLayoutComponent implements OnInit, OnDestroy {
  private document = inject(DOCUMENT);
  private originalFaviconHref: string | null = null;
  private originalScrollBehavior = '';

  ngOnInit(): void {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      this.originalFaviconHref = link.href;
      link.href = 'assets/rapimnas/logo-rapimnas.png';
    }

    /** Scoped to this shell's lifetime so fragment scrolls (e.g. "Jelajahi Acara") animate smoothly without affecting scroll behavior on the rest of the site. */
    this.originalScrollBehavior = this.document.documentElement.style.scrollBehavior;
    this.document.documentElement.style.scrollBehavior = 'smooth';
  }

  ngOnDestroy(): void {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && this.originalFaviconHref) {
      link.href = this.originalFaviconHref;
    }

    this.document.documentElement.style.scrollBehavior = this.originalScrollBehavior;
  }
}
