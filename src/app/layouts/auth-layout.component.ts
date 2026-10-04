import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Bingkai halaman autentikasi: dipasang bersarang di dalam PublicLayoutComponent
 * (navbar & footer landing page yang sama). Latar belakang memakai bahasa
 * visual yang SAMA PERSIS dengan app-page-hero (gradien diagonal 3-stop +
 * glow radial emas + tekstur titik, lihat shared/page-hero.component.ts)
 * TANPA mesin kontennya (badge/judul/kutipan Hadis-Qur'an/ilustrasi) — di
 * sini backdrop itu murni dipakai sebagai latar di belakang SATU kartu form
 * yang di-tengah-kan, bukan halaman landing. Panel kiri berisi ayat & poin
 * komunitas dakwah yang sebelumnya ada DIHAPUS sepenuhnya (konten teks
 * dianggap tidak perlu di halaman auth) — hanya kartu + isinya form.
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
    /* Backdrop — gradien diagonal + glow radial, disalin PERSIS dari
       .hero/.hero::after app-page-hero (hanya bagian latar, bukan
       badge/judul/kutipan/ilustrasinya) supaya satu bahasa visual dengan
       halaman publik lain (Galeri/Struktur/Kontak/Berita), tapi di sini
       cuma jadi panggung untuk satu kartu di tengah, bukan hero bertopik. */
    .auth-wash {
      position: relative; overflow: hidden;
      min-height: 70vh;
      display: flex; align-items: center; justify-content: center;
      padding: 56px 24px;
      background: linear-gradient(122deg, var(--color-primary-tint) 0%, var(--color-primary-soft) 58%, var(--color-gold-soft) 100%);
    }
    .auth-wash::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 60% 70% at 78% 60%, var(--color-gold-soft) 0%, var(--color-primary-soft) 40%, transparent 75%);
      opacity: .9;
    }
    .auth-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .7; pointer-events: none;
      background-image: radial-gradient(circle, var(--color-primary-soft) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 80% -10px;
      mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
    }

    .auth-card {
      position: relative; z-index: 1; box-sizing: border-box;
      width: 100%; max-width: 420px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); padding: 36px;
    }

    @media (max-width: 480px) {
      .auth-wash { padding: 40px 16px; min-height: 60vh; }
      .auth-card { padding: 28px 24px; }
    }
  `],
})
export class AuthLayoutComponent {}
