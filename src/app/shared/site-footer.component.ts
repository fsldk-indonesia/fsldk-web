import { Component } from '@angular/core';
import { IconComponent } from './icon.component';

/** Footer landing page — dipakai di PublicLayoutComponent dan KaderLayoutComponent
 *  (miss-development-prompt-2.md poin 4: navbar & footer Portal Kader HARUS identik
 *  dengan landing page, bedanya cuma ada sidebar). */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [IconComponent],
  template: `
    <footer class="pub-footer pattern-motif pattern-motif-dark">
      <div class="container">
        <div class="flex items-center justify-between foot-top">
          <span class="brand-text light">FSLDK <b>Indonesia</b></span>
          <span class="foot-tagline">
            <svg class="foot-glyph" width="34" height="26" viewBox="0 0 34 26" aria-hidden="true">
              <path class="network-line" d="M17,13 L4,4 M17,13 L4,22 M17,13 L30,4 M17,13 L30,22" style="stroke:rgba(255,255,255,.35)" />
              <circle class="network-node" cx="17" cy="13" r="4" />
              <circle class="network-node gold" cx="4" cy="4" r="2.3" style="animation-delay:.3s" />
              <circle class="network-node ember" cx="4" cy="22" r="2.3" style="animation-delay:.6s" />
              <circle class="network-node gold" cx="30" cy="4" r="2.3" style="animation-delay:.9s" />
              <circle class="network-node ember" cx="30" cy="22" r="2.3" style="animation-delay:1.2s" />
            </svg>
            Menyatukan Langkah Dakwah Kampus se-Indonesia
          </span>
        </div>

        <nav class="foot-social" aria-label="Media sosial FSLDK Indonesia">
          @for (s of socialLinks; track s.href) {
            <a [href]="s.href" target="_blank" rel="noopener" class="foot-social-link">
              <app-icon [name]="s.icon" [size]="15" />{{ s.handle }}
            </a>
          }
        </nav>

        <p class="foot-copy">&copy; {{ year }} Perkumpulan Forum Silaturahmi Lembaga Dakwah Kampus Indonesia. Sejak 1986.</p>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    /* Tanpa margin-top: margin ada DI LUAR background gelap footer, jadi
       kalau diberi jarak lewat margin, warna putih halaman di belakangnya
       akan terlihat sebagai garis/celah putih tepat sebelum footer.
       Jarak sebelum footer sudah cukup dari padding section di atasnya. */
    .pub-footer { background: var(--color-text); color: #c9cdd1; padding: 40px 0; }
    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text.light { color: #fff; } .brand-text.light b { color: var(--color-primary-bright); }
    .foot-top { padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.1); flex-wrap: wrap; gap: 12px; }
    .foot-tagline { display: flex; align-items: center; gap: 10px; }
    .foot-glyph { flex-shrink: 0; overflow: visible; }
    .foot-social { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
    .foot-social-link {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px;
      border-radius: var(--radius-full); background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
      color: #fff; font-weight: 600; font-size: .82rem;
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .foot-social-link app-icon { color: var(--color-primary-bright); }
    .foot-social-link:hover { background: rgba(255,255,255,.14); border-color: var(--color-gold); text-decoration: none; transform: translateY(-2px); }
    .foot-copy { margin-top: 20px; font-size: .85rem; color: var(--color-muted); }
  `],
})
export class SiteFooterComponent {
  year = new Date().getFullYear();

  readonly socialLinks = [
    { icon: 'instagram', handle: 'fsldkindonesia', href: 'https://instagram.com/fsldkindonesia' },
    { icon: 'facebook', handle: 'fsldkindonesia', href: 'https://facebook.com/fsldkindonesia' },
    { icon: 'tiktok', handle: 'fsldkindonesia', href: 'https://tiktok.com/@fsldkindonesia' },
    { icon: 'x-twitter', handle: 'fsldkindonesia_', href: 'https://x.com/fsldkindonesia_' },
    { icon: 'youtube', handle: 'fsldkindonesia5655', href: 'https://youtube.com/@fsldkindonesia5655' },
  ];
}
