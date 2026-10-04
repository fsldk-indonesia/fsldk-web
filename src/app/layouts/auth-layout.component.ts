import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon.component';

/**
 * Bingkai halaman autentikasi — shell SENDIRI di root routes (BUKAN lagi
 * bersarang di dalam PublicLayoutComponent, lihat app.routes.ts), jadi
 * tidak ada navbar/footer/WhatsApp FAB landing page sama sekali. Latar
 * belakang memakai bahasa visual yang SAMA PERSIS dengan hero GELAP di
 * halaman detail Galeri/Berita (gradien diagonal hijau tua + glow radial
 * emas + tekstur titik, lihat .hero-section di gallery.public-detail.page.ts)
 * — BUKAN gradien terang app-page-hero (itu untuk halaman index). Tidak
 * ada mesin konten hero apa pun (badge/judul/kutipan/ilustrasi) — backdrop
 * gelap ini murni jadi panggung untuk satu kartu putih yang di-tengah-kan.
 * Panel kiri berisi ayat & poin komunitas dakwah yang sebelumnya ada
 * DIHAPUS sepenuhnya — hanya kartu + isinya form, ditutup tautan "Kembali
 * ke Beranda" di dalam kartu itu sendiri (satu-satunya jalan keluar karena
 * tidak ada navbar lagi).
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, IconComponent],
  template: `
    <div class="auth-wash">
      <div class="auth-texture" aria-hidden="true"></div>
      <div class="auth-card">
        <router-outlet />
        <a routerLink="/" class="auth-back-home">
          <app-icon name="arrow-left" [size]="13" /> Kembali ke Beranda
        </a>
      </div>
    </div>
  `,
  styles: [`
    /* Backdrop — gradien hijau tua diagonal + glow radial emas + tekstur
       titik, disalin PERSIS dari .hero-section/.hero-glow/.hero-texture
       milik hero gelap di detail Galeri/Berita (BUKAN gradien terang
       app-page-hero yang dipakai halaman index) — di sini cuma jadi
       panggung gelap untuk satu kartu putih di tengah. */
    .auth-wash {
      position: relative; overflow: hidden;
      min-height: 100dvh;
      display: flex; align-items: center; justify-content: center;
      padding: 28px 24px;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    .auth-wash::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    .auth-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }

    .auth-card {
      position: relative; z-index: 1; box-sizing: border-box;
      width: 100%; max-width: 400px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: 0 24px 50px rgba(0,0,0,.35); padding: 26px 28px;
    }

    /* Satu-satunya jalan keluar dari halaman auth sekarang (tidak ada
       navbar lagi) — ditaruh di layout (bukan tiap page) supaya otomatis
       muncul konsisten di kelima halaman (login/daftar/lupa-password/
       reset-password/verifikasi-email) tanpa diulang manual. */
    .auth-back-home {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border);
      font-size: .82rem; font-weight: 700; color: var(--color-text-secondary);
      text-decoration: none;
    }
    .auth-back-home:hover { color: var(--color-primary-dark); text-decoration: none; }

    @media (max-width: 480px) {
      .auth-wash { padding: 20px 16px; }
      .auth-card { padding: 22px 20px; }
    }
  `],
})
export class AuthLayoutComponent {}
