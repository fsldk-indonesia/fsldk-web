import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';

/** Layout Landing Page publik: header (menu statis) + konten + footer. */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="pub-header">
      <div class="container flex items-center justify-between">
        <a routerLink="/" class="brand">
          <span class="brand-icon"><span class="pin"></span></span>
          <span class="brand-text">FSLDK <b>Indonesia</b><small>Forum Silaturahmi Dakwah Kampus</small></span>
        </a>
        <nav class="pub-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Beranda</a>
          <a routerLink="/tentang" routerLinkActive="active">Tentang</a>
          <a routerLink="/berita" routerLinkActive="active">Berita</a>
          <a routerLink="/artikel" routerLinkActive="active">Artikel</a>
          <a routerLink="/kontak" routerLinkActive="active">Kontak</a>
        </nav>
        <div class="flex items-center gap-sm">
          @if (auth.isLoggedIn()) {
            <a routerLink="/cms/dashboard" class="btn btn-primary btn-sm">Masuk CMS</a>
          } @else {
            <a routerLink="/login" class="btn btn-outline btn-sm">Masuk</a>
            <a routerLink="/daftar" class="btn btn-primary btn-sm">Gabung LDK Kami</a>
          }
        </div>
      </div>
    </header>

    <main><router-outlet /></main>

    <footer class="pub-footer">
      <div class="container">
        <div class="flex items-center justify-between foot-top">
          <span class="brand-text light">FSLDK <b>Indonesia</b></span>
          <span>Menyatukan Langkah Dakwah Kampus se-Indonesia</span>
        </div>
        <p class="foot-copy">&copy; {{ year }} Perkumpulan Forum Silaturahmi Lembaga Dakwah Kampus Indonesia. Sejak 1986.</p>
      </div>
    </footer>
  `,
  styles: [`
    .pub-header { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--color-border); padding: 14px 0; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; }
    .pin { width: 18px; height: 18px; background: var(--color-primary); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }
    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text b { color: var(--color-primary); display: inline; }
    .brand-text small { font-family: var(--font-body); font-weight: 500; font-size: .68rem; letter-spacing: .04em; text-transform: uppercase; color: var(--color-muted); }
    .brand-text.light { color: #fff; } .brand-text.light b { color: var(--color-primary-bright); }
    .pub-nav { display: flex; gap: 28px; }
    .pub-nav a { color: var(--color-text); font-weight: 600; font-size: .95rem; }
    .pub-nav a.active { color: var(--color-primary); }
    .pub-footer { background: var(--color-text); color: #c9cdd1; padding: 40px 0; margin-top: 40px; }
    .foot-top { padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.1); flex-wrap: wrap; gap: 12px; }
    .foot-copy { margin-top: 20px; font-size: .85rem; color: var(--color-muted); }
    @media (max-width: 780px) { .pub-nav { display: none; } }
  `],
})
export class PublicLayoutComponent {
  auth = inject(AuthRepository);
  year = new Date().getFullYear();
}
