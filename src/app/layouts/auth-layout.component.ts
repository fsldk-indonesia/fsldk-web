import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Layout untuk halaman autentikasi: panel branding hijau + area form. */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-wrap">
      <aside class="auth-brand">
        <div class="brand-mark">
          <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia">
        </div>
        <h1>Panel FSLDK Indonesia</h1>
        <p>Kelola berita, pengguna, dan peran akses untuk mendukung gerak dakwah kampus yang terpadu dan kompak.</p>
        <span class="brand-foot">40 Tahun Merajut Ukhuwah · Sejak 1986</span>
      </aside>
      <main class="auth-main">
        <div class="auth-card">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .auth-brand { background: linear-gradient(160deg, #00933b, #046428); color: #fff; padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
    .auth-brand::after { content: ''; position: absolute; width: 340px; height: 340px; border-radius: 999px; background: rgba(255,255,255,.08); bottom: -120px; left: -80px; }
    .brand-mark { width: 64px; height: 64px; border-radius: 18px; overflow: hidden; margin-bottom: 28px; box-shadow: 0 6px 18px rgba(0,0,0,.2); }
    .brand-mark img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .auth-brand h1 { color: #fff; font-size: 2.1rem; max-width: 360px; }
    .auth-brand p { color: #eafbf1; max-width: 380px; font-size: 1.02rem; }
    .brand-foot { margin-top: 28px; font-size: .85rem; color: #eafbf1; opacity: .85; }
    .auth-main { display: flex; align-items: center; justify-content: center; padding: 40px 24px; background: var(--color-bg-warm); }
    .auth-card { width: 100%; max-width: 420px; }
    @media (max-width: 860px) { .auth-wrap { grid-template-columns: 1fr; } .auth-brand { display: none; } }
  `],
})
export class AuthLayoutComponent {}
