import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Bingkai halaman autentikasi: dipasang bersarang di dalam PublicLayoutComponent
 * (navbar & footer landing page yang sama, persis pola ldksyahid-app) — bukan
 * shell terpisah. Panel kiri berisi ayat & poin komunitas dakwah yang bersifat
 * umum, bukan pesan "Panel CMS", karena halaman login/daftar diperuntukkan
 * bagi masyarakat umum, tidak hanya pengguna dengan akses CMS.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <section class="auth-shell container">
      <aside class="auth-visual pattern-motif">
        <blockquote class="auth-ayat">
          <p>"Dan hendaklah ada di antara kamu segolongan umat yang menyeru kepada kebajikan, menyuruh kepada yang ma'ruf dan mencegah dari yang munkar; merekalah orang-orang yang beruntung."</p>
          <cite>QS. Ali 'Imran: 104</cite>
        </blockquote>
        <ul class="auth-points">
          <li>Ratusan Lembaga Dakwah Kampus se-Indonesia</li>
          <li>Pembinaan dan kaderisasi dai kampus</li>
          <li>Jaringan ukhuwah lintas kampus dan daerah</li>
        </ul>
      </aside>
      <div class="auth-card">
        <router-outlet />
      </div>
    </section>
  `,
  styles: [`
    .auth-shell { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; padding: 56px 24px; }
    .auth-visual { padding: 8px; }
    .auth-ayat { border-left: 3px solid var(--color-primary); padding-left: 20px; margin: 0 0 28px; }
    .auth-ayat p { font-family: var(--font-heading); font-size: 1.15rem; color: var(--color-text); line-height: 1.6; margin: 0 0 10px; }
    .auth-ayat cite { color: var(--color-primary); font-weight: 600; font-size: .88rem; font-style: normal; }
    .auth-points { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .auth-points li { display: flex; align-items: center; gap: 10px; color: var(--color-text-secondary); font-size: .95rem; }
    /* Titik simpul berdenyut bergantian hijau/emas/ember — gema motif
       jaringan yang sama dipakai di hero & navbar, bukan bullet polos. */
    .auth-points li::before { content: ''; width: 8px; height: 8px; border-radius: 999px; background: var(--color-primary); flex-shrink: 0; animation: node-pulse 2.6s ease-in-out infinite; }
    .auth-points li:nth-child(2)::before { background: var(--color-gold); animation-delay: .3s; }
    .auth-points li:nth-child(3)::before { background: var(--color-ember); animation-delay: .6s; }
    .auth-card { width: 100%; max-width: 420px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 36px; }
    @media (max-width: 860px) { .auth-shell { grid-template-columns: 1fr; padding: 32px 20px; } .auth-visual { display: none; } .auth-card { max-width: 100%; margin: 0 auto; } }
  `],
})
export class AuthLayoutComponent {}
