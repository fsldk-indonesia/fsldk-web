import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon.component';

/**
 * Bingkai halaman pengisian Formulir Dinamis publik (`/form/:slug`) — shell
 * SENDIRI di root routes (BUKAN bersarang di dalam PublicLayoutComponent,
 * lihat app.routes.ts), jadi tidak ada navbar/footer/WhatsApp FAB landing
 * page. Backdrop memakai bahasa visual yang SAMA PERSIS dengan
 * AuthLayoutComponent (gradien diagonal hijau tua + glow radial emas +
 * tekstur titik) supaya konsisten dengan halaman auth — bedanya kartu di
 * sini jauh lebih lebar (formulir bisa multi-bagian/panjang, bukan sekadar
 * login) dan tautan "Kembali ke Beranda" diapungkan (fixed) di pojok
 * kiri-atas backdrop (bukan di dalam/bawah kartu seperti auth) supaya tetap
 * terlihat walau kartu form di-scroll panjang — KECUALI di mobile (≤640px),
 * di sana ia sengaja TIDAK sticky (position: static, bagian dari alur
 * normal di atas kartu) karena di layar sempit sebuah pil fixed yang selalu
 * menempel di pojok terasa mengganggu/menutupi, bukan membantu.
 */
@Component({
  selector: 'app-form-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, IconComponent],
  template: `
    <div class="form-wash">
      <div class="form-texture" aria-hidden="true"></div>
      <a routerLink="/" class="form-back-home">
        <app-icon name="arrow-left" [size]="13" /> Kembali ke Beranda
      </a>
      <div class="form-shell">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    /* Backdrop — identik .auth-wash/.auth-texture milik AuthLayoutComponent,
       disalin apa adanya supaya "background ikutin halaman auth" konsisten
       lintas kedua shell tanpa navbar ini. */
    .form-wash {
      position: relative; overflow-x: hidden;
      min-height: 100dvh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 72px 24px 48px;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    .form-wash::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    .form-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }

    /* Satu-satunya jalan keluar dari halaman form (tidak ada navbar) —
       diapungkan (fixed) di pojok kiri-atas backdrop gelap, bukan di dalam
       kartu, supaya tetap terjangkau walau formulir multi-bagian/panjang
       membuat kartunya di-scroll jauh ke bawah. */
    .form-back-home {
      position: fixed; top: 22px; left: 24px; z-index: 2;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 9px 16px; border-radius: var(--radius-full);
      background: rgba(255,255,255,.12); backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,.22);
      font-size: .82rem; font-weight: 700; color: #fff;
      text-decoration: none; transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .form-back-home:hover { background: rgba(255,255,255,.2); color: #fff; text-decoration: none; transform: translateY(-1px); }

    .form-shell {
      position: relative; z-index: 1; box-sizing: border-box;
      width: 100%; max-width: 760px;
    }

    /* Mobile — back-home lepas dari "fixed" dan jadi elemen alur biasa di
       atas kartu (lihat komentar komponen), jadi .form-wash tak perlu lagi
       padding-top ekstra untuk memberi ruang overlay fixed. */
    @media (max-width: 640px) {
      .form-wash { padding: 20px 14px 32px; }
      .form-back-home {
        position: static; align-self: flex-start;
        margin-bottom: 16px; padding: 7px 13px; font-size: .78rem;
      }
    }
  `],
})
export class FormLayoutComponent {}
