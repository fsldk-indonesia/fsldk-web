import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Bingkai halaman autentikasi: dipasang bersarang di dalam PublicLayoutComponent
 * (navbar & footer landing page yang sama). Latar belakang memakai bahasa
 * visual yang SAMA PERSIS dengan hero GELAP di halaman detail Galeri/Berita
 * (gradien diagonal hijau tua + glow radial emas + tekstur titik, lihat
 * .hero-section di gallery.public-detail.page.ts) — BUKAN gradien terang
 * app-page-hero (itu untuk halaman index). Tidak ada mesin konten hero
 * apa pun (badge/judul/kutipan/ilustrasi) — backdrop gelap ini murni jadi
 * panggung untuk satu kartu putih yang di-tengah-kan. Panel kiri berisi
 * ayat & poin komunitas dakwah yang sebelumnya ada DIHAPUS sepenuhnya
 * (konten teks dianggap tidak perlu di halaman auth) — hanya kartu + isinya form.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-wash">
      <div class="auth-texture" aria-hidden="true"></div>
      <div class="auth-card">
        <router-outlet />
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
      min-height: 70vh;
      display: flex; align-items: center; justify-content: center;
      padding: 56px 24px;
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
      width: 100%; max-width: 420px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: 0 24px 50px rgba(0,0,0,.35); padding: 36px;
    }

    @media (max-width: 480px) {
      .auth-wash { padding: 40px 16px; min-height: 60vh; }
      .auth-card { padding: 28px 24px; }
    }
  `],
})
export class AuthLayoutComponent {}
