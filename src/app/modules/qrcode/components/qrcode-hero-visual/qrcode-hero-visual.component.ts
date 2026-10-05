import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';

/**
 * Ilustrasi hero bersama untuk kedua halaman publik QR Code (ajukan & detail)
 * — satu kode QR di tengah sebagai hub, memancar ke titik-titik yang
 * mewakili berbagai media penggunaannya (poster, WhatsApp, media sosial).
 * Mekanisme garis "menggambar sendiri" + simpul berdenyut + lencana pop-in
 * identik dengan ilustrasi hero Shortlink/Goods/Kontak (strokeDasharray via
 * WAAPI), motif tengahnya diganti kotak QR bergaya finder-pattern.
 */
@Component({
  selector: 'app-qrcode-hero-visual',
  standalone: true,
  template: `
    <svg aria-hidden="true" viewBox="0 0 480 320" class="qhv-svg">
      <defs>
        <linearGradient id="qhvFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--color-primary-bright)" />
          <stop offset="100%" stop-color="var(--color-primary)" />
        </linearGradient>
        <filter id="qhvSoftBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <ellipse class="qhv-ground-shadow" cx="240" cy="246" rx="95" ry="10" filter="url(#qhvSoftBlur)" />

      <g class="qhv-silhouette" transform="translate(240,120)">
        <rect x="-38" y="-38" width="76" height="76" rx="16" fill="none" stroke="url(#qhvFill)" stroke-width="7" />
        <rect x="-32" y="-32" width="20" height="20" rx="5" fill="url(#qhvFill)" />
        <rect x="12" y="-32" width="20" height="20" rx="5" fill="url(#qhvFill)" />
        <rect x="-32" y="12" width="20" height="20" rx="5" fill="url(#qhvFill)" />
        <rect x="10" y="10" width="9" height="9" rx="2" fill="url(#qhvFill)" />
        <rect x="10" y="22" width="9" height="9" rx="2" fill="url(#qhvFill)" />
        <rect x="22" y="10" width="9" height="9" rx="2" fill="url(#qhvFill)" />
      </g>

      <path #qhvLine class="qhv-line thick" d="M240,120 L120,85" />
      <path #qhvLine class="qhv-line thick" d="M240,120 L240,45" />
      <path #qhvLine class="qhv-line thick" d="M240,120 L360,85" />
      <path #qhvLine class="qhv-line" d="M120,85 L55,70" />
      <path #qhvLine class="qhv-line" d="M120,85 L75,150" />
      <path #qhvLine class="qhv-line" d="M240,45 L190,15" />
      <path #qhvLine class="qhv-line" d="M240,45 L290,15" />
      <path #qhvLine class="qhv-line" d="M360,85 L425,70" />
      <path #qhvLine class="qhv-line" d="M360,85 L405,150" />

      <g class="qhv-tier qhv-tier-0">
        <circle class="network-ping" cx="240" cy="120" r="14" />
        <circle class="network-node" cx="240" cy="120" r="14" />
      </g>
      <g class="qhv-tier qhv-tier-1">
        <circle class="network-ping gold" cx="120" cy="85" r="10" style="animation-delay:.3s" />
        <circle class="network-node gold" cx="120" cy="85" r="10" />
        <circle class="network-ping gold" cx="240" cy="45" r="10" style="animation-delay:.6s" />
        <circle class="network-node gold" cx="240" cy="45" r="10" />
        <circle class="network-ping gold" cx="360" cy="85" r="10" style="animation-delay:.9s" />
        <circle class="network-node gold" cx="360" cy="85" r="10" />
      </g>
      <g class="qhv-tier qhv-tier-2">
        <circle class="network-node ember" cx="55" cy="70" r="6" />
        <circle class="network-node ember" cx="75" cy="150" r="6" />
        <circle class="network-node ember" cx="190" cy="15" r="6" />
        <circle class="network-node ember" cx="290" cy="15" r="6" />
        <circle class="network-node ember" cx="425" cy="70" r="6" />
        <circle class="network-node ember" cx="405" cy="150" r="6" />
      </g>

      <g class="qhv-badge">
        <circle cx="335" cy="175" r="15" fill="#fff" stroke="var(--color-gold)" stroke-width="3" />
        <path d="M328,175 L333,181 L344,169" fill="none" stroke="var(--color-gold-dark)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>
  `,
  styles: [`
    :host { position: relative; display: block; width: 100%; }
    .qhv-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .qhv-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: qhvGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes qhvGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .qhv-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .qhv-silhouette { animation: none; opacity: 1; transform: none; } }

    .qhv-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .qhv-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .qhv-tier { opacity: 0; animation: qhvTierFadeIn .4s ease-out forwards; }
    .qhv-tier-0 { animation-delay: .75s; }
    .qhv-tier-1 { animation-delay: 1.3s; }
    .qhv-tier-2 { animation-delay: 1.8s; }
    @keyframes qhvTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .qhv-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: qhvBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes qhvBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .qhv-tier, .qhv-badge { animation: none; opacity: 1; transform: none; } }
  `],
})
export class QrcodeHeroVisualComponent implements AfterViewInit {
  @ViewChildren('qhvLine') private lineRefs!: QueryList<ElementRef<SVGPathElement>>;

  ngAfterViewInit(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lineRefs?.forEach((ref, i) => {
      const path = ref.nativeElement;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      if (reduced) { path.style.strokeDashoffset = '0'; return; }
      path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 600, delay: 700 + i * 130, easing: 'ease-out', fill: 'forwards' },
      );
    });
  }
}
