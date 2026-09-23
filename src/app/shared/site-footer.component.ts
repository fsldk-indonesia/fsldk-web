import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { NewsletterFormComponent } from './newsletter-form.component';
import { schedulePath } from '../modules/schedule/schedule.path';
import { zakatPath } from '../modules/zakat/zakat.path';
import { goodsPath } from '../modules/goods/goods.path';

/** Footer landing page — dipakai di PublicLayoutComponent dan KaderLayoutComponent
 *  (miss-development-prompt-2.md poin 4: navbar & footer Portal Kader HARUS identik
 *  dengan landing page, bedanya cuma ada sidebar). */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, IconComponent, NewsletterFormComponent],
  template: `
    <footer class="pub-footer">
      <div class="foot-wave">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path style="fill: var(--color-text)" d="M0,64C240,160,480,192,720,160C960,128,1200,32,1440,64L1440,320L0,320Z"></path>
        </svg>
      </div>

      <div class="foot-main">
        <div class="container">
          <div class="grid grid-4 foot-cols">
            <div class="foot-col">
              <span class="brand-text light">FSLDK <b>Indonesia</b></span>
              <p class="foot-tagline">Menyatukan Langkah Dakwah Kampus se-Indonesia</p>
              <p class="foot-desc">Forum silaturahmi &amp; pusat koordinasi Lembaga Dakwah Kampus se-Indonesia — merawat ukhuwah, membina kader, menggerakkan dakwah yang terpadu. Sejak 1986.</p>
              <nav class="foot-social" aria-label="Media sosial FSLDK Indonesia">
                @for (s of socialLinks; track s.href) {
                  <a [href]="s.href" target="_blank" rel="noopener" class="foot-social-btn" [attr.aria-label]="s.handle"><app-icon [name]="s.icon" [size]="15" /></a>
                }
              </nav>
            </div>

            <div class="foot-col">
              <h5 class="foot-title"><app-icon name="sparkles" [size]="15" />Jelajahi</h5>
              <div class="foot-links-grid">
                @for (l of exploreLinks; track l.href) {
                  <a [routerLink]="l.href" class="foot-link-card"><app-icon [name]="l.icon" [size]="16" /><span>{{ l.label }}</span></a>
                }
              </div>
            </div>

            <div class="foot-col">
              <h5 class="foot-title"><app-icon name="info-circle" [size]="15" />Tentang Kami</h5>
              <ul class="foot-plain-list">
                @for (l of tentangLinks; track l.href) {
                  <li><a [routerLink]="l.href"><app-icon [name]="l.icon" [size]="14" />{{ l.label }}</a></li>
                }
              </ul>
            </div>

            <div class="foot-col">
              <h5 class="foot-title"><app-icon name="mail" [size]="15" />Berlangganan</h5>
              <p class="foot-desc">Dapatkan kabar &amp; info kegiatan FSLDK Indonesia langsung ke email Anda.</p>
              <app-newsletter-form />
            </div>
          </div>

          <p class="foot-copy">&copy; {{ year }} Perkumpulan Forum Silaturahmi Lembaga Dakwah Kampus Indonesia. Sejak 1986.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    /* Background gelap SENGAJA ada di .foot-main, BUKAN di <footer> sendiri
       — kalau ditaruh di <footer>, dia jadi "di belakang" .foot-wave juga
       (karena .foot-wave anak dari <footer>), sehingga bagian transparan
       SVG wave-nya cuma menembus warna gelap yang SAMA lagi (bukan warna
       putih halaman di ATAS footer) dan wave-nya jadi tak kelihatan sama
       sekali walau path/fill-nya sendiri sudah benar. Struktur ini
       mengikuti pola ldksyahid-app (.footer-fun transparan, .footer-main
       yang gelap, wave sebagai sibling sebelum -main, bukan child-nya). */
    .pub-footer { position: relative; color: #c9cdd1; }
    .foot-wave { position: relative; height: 60px; overflow: hidden; }
    .foot-wave svg { position: absolute; bottom: 0; width: 100%; height: 100%; }
    .foot-main { background: var(--color-text); }
    .foot-main .container { padding-top: 8px; padding-bottom: 32px; }

    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text.light { color: #fff; } .brand-text.light b { color: var(--color-primary-bright); }

    .foot-cols { align-items: start; }
    .foot-col { display: flex; flex-direction: column; gap: 10px; }
    .foot-tagline { font-weight: 600; color: var(--color-primary-bright); font-size: .85rem; margin: 0; }
    .foot-desc { color: #9aa39c; font-size: .85rem; line-height: 1.6; margin: 0; }

    .foot-social { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .foot-social-btn {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm); background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); color: #fff;
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .foot-social-btn:hover { background: var(--color-primary); border-color: var(--color-primary); text-decoration: none; transform: translateY(-2px); }

    .foot-title { display: flex; align-items: center; gap: 8px; color: #fff; font-family: var(--font-heading); font-size: .95rem; font-weight: 700; margin: 0 0 2px; }
    .foot-title app-icon { color: var(--color-primary-bright); }

    .foot-links-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .foot-link-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; padding: 10px 6px;
      border-radius: var(--radius-sm); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: #c9cdd1;
      font-size: .74rem; font-weight: 600; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .foot-link-card app-icon { color: var(--color-primary-bright); }
    .foot-link-card:hover { background: rgba(0,147,59,.18); border-color: var(--color-primary); color: #fff; text-decoration: none; transform: translateY(-2px); }

    .foot-plain-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .foot-plain-list a { display: flex; align-items: center; gap: 8px; padding: 6px 0; color: #c9cdd1; font-size: .85rem; font-weight: 500; transition: color var(--motion-fast) ease; }
    .foot-plain-list a app-icon { color: var(--color-primary-bright); flex-shrink: 0; }
    .foot-plain-list a:hover { color: #fff; text-decoration: none; }

    .foot-copy { margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.1); font-size: .8rem; color: var(--color-muted); }

    @media (max-width: 600px) { .foot-wave { height: 36px; } }
  `],
})
export class SiteFooterComponent {
  year = new Date().getFullYear();

  readonly socialLinks = [
    { icon: 'instagram', handle: 'Instagram @fsldkindonesia', href: 'https://instagram.com/fsldkindonesia' },
    { icon: 'facebook', handle: 'Facebook fsldkindonesia', href: 'https://facebook.com/fsldkindonesia' },
    { icon: 'tiktok', handle: 'TikTok @fsldkindonesia', href: 'https://tiktok.com/@fsldkindonesia' },
    { icon: 'x-twitter', handle: 'X @fsldkindonesia_', href: 'https://x.com/fsldkindonesia_' },
    { icon: 'youtube', handle: 'YouTube fsldkindonesia5655', href: 'https://youtube.com/@fsldkindonesia5655' },
  ];

  readonly exploreLinks = [
    { icon: 'megaphone', label: 'Berita', href: '/berita' },
    { icon: 'file-text', label: 'Artikel', href: '/artikel' },
    { icon: 'book-open', label: 'Perpustakaan', href: '/perpustakaan' },
    { icon: 'calendar-days', label: 'Event', href: '/event' },
    { icon: 'calendar', label: 'Jadwal', href: schedulePath.publicIndex },
    { icon: 'hand-heart', label: 'Kantong Amal', href: '/kantong-amal' },
    { icon: 'calculator', label: 'Kalkulator Zakat', href: zakatPath.calculator },
    { icon: 'shopping-bag', label: 'FSLDK Goods', href: goodsPath.publicIndex },
  ];

  readonly tentangLinks = [
    { icon: 'sitemap', label: 'Struktur Organisasi', href: '/tentang/struktur' },
    { icon: 'photo', label: 'Galeri', href: '/tentang/galeri' },
    { icon: 'file-bar-chart', label: 'Statistik Jaringan', href: '/tentang/statistik-jaringan' },
    { icon: 'messages', label: 'Hubungi Kami', href: '/tentang/kontak' },
  ];
}
