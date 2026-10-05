import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { KantongAmalDonationFlowBackLinkService } from './kantong-amal-donation-flow-back-link.service';

/**
 * Bingkai alur Donasi Kantong Amal (donate -> payment-status -> donation-receipt)
 * — shell SENDIRI di root routes (BUKAN bersarang di dalam PublicLayoutComponent,
 * lihat app.routes.ts), jadi tidak ada navbar/footer/WhatsApp FAB landing page.
 * Backdrop memakai bahasa visual yang SAMA PERSIS dengan AuthLayoutComponent/
 * FormLayoutComponent (gradien diagonal hijau tua + glow radial emas + tekstur
 * titik) — bedanya kartu di sini lebih lebar lagi (halaman donate dua-kolom:
 * form + ringkasan campaign) dan tautan kembali diapungkan (fixed) di pojok
 * kiri-atas sama seperti FormLayoutComponent (bukan di dalam kartu seperti
 * AuthLayoutComponent), supaya tetap terjangkau di ketiga halaman alur ini
 * walau kartu masing-masing tingginya beda-beda.
 *
 * Tujuan & label tautan itu sendiri DINAMIS (bukan selalu "Kembali ke
 * Beranda") — lihat KantongAmalDonationFlowBackLinkService: layout ini tidak
 * tahu campaign/donasi mana yang sedang dilihat, jadi tiap halaman anak
 * (donate/payment-status/donation-receipt) yang meng-update service itu
 * begitu slug campaign-nya diketahui, supaya user yang sedang di tengah alur
 * donasi diarahkan balik ke Detail Campaign yang relevan, bukan ke Beranda.
 */
@Component({
  selector: 'app-kantong-amal-donation-flow-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, IconComponent],
  providers: [KantongAmalDonationFlowBackLinkService],
  template: `
    <div class="flow-wash">
      <div class="flow-texture" aria-hidden="true"></div>
      <a [routerLink]="backLink.link().path" class="flow-back-home">
        <app-icon name="arrow-left" [size]="13" /> {{ backLink.link().label }}
      </a>
      <div class="flow-shell">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    /* Backdrop — identik .auth-wash/.auth-texture & .form-wash/.form-texture,
       disalin apa adanya supaya "background ikutin halaman auth" konsisten
       lintas semua shell tanpa navbar. */
    .flow-wash {
      /* overflow-x: clip (BUKAN overflow-x: hidden) — overflow-x:hidden tanpa
         overflow-y eksplisit membuat browser otomatis meng-compute overflow-y
         jadi auto juga (aturan CSS2.1 §11.1.1, pola bug yang sama persis
         didokumentasikan di PageHeroComponent/.hero), menjadikan .flow-wash
         scroll container TERSENDIRI (bukan dokumen/viewport) — itu yang
         membuat .side-card-inner (position:sticky, lihat bawah) salah
         hitung ancestor scroll-nya dan top-nya jadi tidak sejajar dengan
         .form-card. clip tidak memicu auto-pairing itu. */
      position: relative; overflow-x: clip; overflow-y: visible;
      min-height: 100dvh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 72px 24px 48px;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    .flow-wash::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    .flow-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }

    /* Satu-satunya jalan keluar dari alur donasi (tidak ada navbar) — fixed
       di pojok kiri-atas backdrop gelap supaya tetap terjangkau walau kartu
       halaman manapun di alur ini (form donasi dua-kolom, status QRIS,
       bukti donasi) di-scroll panjang. */
    .flow-back-home {
      position: fixed; top: 22px; left: 24px; z-index: 2;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 9px 16px; border-radius: var(--radius-full);
      background: rgba(255,255,255,.12); backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,.22);
      font-size: .82rem; font-weight: 700; color: #fff;
      text-decoration: none; transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .flow-back-home:hover { background: rgba(255,255,255,.2); color: #fff; text-decoration: none; transform: translateY(-1px); }

    /* max-width lebih lebar dari FormLayoutComponent (760px) — halaman donate
       punya layout dua-kolom (form + ringkasan campaign sticky), payment-status
       & donation-receipt tetap memakai kartu sempit (.status-card/.receipt-card
       sudah punya max-width sendiri) yang otomatis ter-pusat di dalam shell
       lebar ini, jadi satu shell cukup untuk ketiga halaman. */
    .flow-shell {
      position: relative; z-index: 1; box-sizing: border-box;
      width: 100%; max-width: 960px;
    }

    @media (max-width: 640px) {
      .flow-wash { padding: 20px 14px 32px; }
      .flow-back-home {
        position: static; align-self: flex-start;
        margin-bottom: 16px; padding: 7px 13px; font-size: .78rem;
      }
    }
  `],
})
export class KantongAmalDonationFlowLayoutComponent {
  protected backLink = inject(KantongAmalDonationFlowBackLinkService);
}
