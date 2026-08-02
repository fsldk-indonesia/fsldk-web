import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';

/** Layout Landing Page publik: navbar sticky (floating saat scroll) + drawer mobile + konten + footer. */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="pub-header" [class.scrolled]="scrolled()">
      <div class="container flex items-center justify-between">
        <a routerLink="/" class="brand" (click)="closeMobile()">
          <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img">
          <span class="brand-text">FSLDK <b>Indonesia</b><small>Forum Silaturahmi Dakwah Kampus</small></span>
        </a>

        <nav class="pub-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Beranda</a>
          <a routerLink="/tentang" routerLinkActive="active">Tentang</a>
          <a routerLink="/berita" routerLinkActive="active">Berita</a>
          <a routerLink="/artikel" routerLinkActive="active">Artikel</a>
          <a routerLink="/kontak" routerLinkActive="active">Kontak</a>
        </nav>

        <div class="flex items-center gap-sm pub-actions">
          @if (auth.isLoggedIn()) {
            <a routerLink="/cms/dashboard" class="btn btn-primary btn-sm">Masuk CMS</a>
          } @else {
            <a routerLink="/login" class="btn btn-outline btn-sm">Masuk</a>
            <a routerLink="/daftar" class="btn btn-primary btn-sm">Gabung LDK Kami</a>
          }
        </div>

        <button class="mobile-toggle" [class.active]="mobileOpen()" (click)="toggleMobile()" aria-label="Buka menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>

    <div class="mobile-overlay" [class.active]="mobileOpen()" (click)="closeMobile()"></div>
    <aside class="mobile-drawer" [class.active]="mobileOpen()">
      <div class="mobile-drawer-head">
        <a routerLink="/" class="brand" (click)="closeMobile()">
          <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img sm">
          <span class="brand-text"><b>FSLDK</b> Indonesia</span>
        </a>
        <button class="mobile-close" (click)="closeMobile()" aria-label="Tutup menu">&times;</button>
      </div>
      <nav class="mobile-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobile()">Beranda</a>
        <a routerLink="/tentang" routerLinkActive="active" (click)="closeMobile()">Tentang</a>
        <a routerLink="/berita" routerLinkActive="active" (click)="closeMobile()">Berita</a>
        <a routerLink="/artikel" routerLinkActive="active" (click)="closeMobile()">Artikel</a>
        <a routerLink="/kontak" routerLinkActive="active" (click)="closeMobile()">Kontak</a>
      </nav>
      <div class="mobile-actions">
        @if (auth.isLoggedIn()) {
          <a routerLink="/cms/dashboard" class="btn btn-primary btn-block" (click)="closeMobile()">Masuk CMS</a>
        } @else {
          <a routerLink="/login" class="btn btn-outline btn-block" (click)="closeMobile()">Masuk</a>
          <a routerLink="/daftar" class="btn btn-primary btn-block" (click)="closeMobile()">Gabung LDK Kami</a>
        }
      </div>
    </aside>

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
    .pub-header { position: sticky; top: 0; z-index: 60; background: rgba(255,255,255,.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--color-border); padding: 16px 0; transition: margin .25s ease, padding .25s ease, border-radius .25s ease, box-shadow .25s ease, background .25s ease; }
    .pub-header.scrolled { margin: 12px 16px 0; padding: 10px 0; border-radius: var(--radius-lg); border: 1px solid var(--color-border); box-shadow: var(--shadow-lg); background: rgba(255,255,255,.97); }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand:hover { text-decoration: none; }
    .brand-logo-img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; transition: transform .2s ease; }
    .brand:hover .brand-logo-img { transform: rotate(-4deg) scale(1.04); }
    .brand-logo-img.sm { width: 36px; height: 36px; }
    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text b { color: var(--color-primary); display: inline; }
    .brand-text small { font-family: var(--font-body); font-weight: 500; font-size: .68rem; letter-spacing: .04em; text-transform: uppercase; color: var(--color-muted); }
    .brand-text.light { color: #fff; } .brand-text.light b { color: var(--color-primary-bright); }

    .pub-nav { display: flex; gap: 28px; }
    .pub-nav a, .mobile-nav a { color: var(--color-text); font-weight: 600; }
    .pub-nav a:hover, .mobile-nav a:hover { text-decoration: none; }
    .pub-nav a { font-size: .95rem; }
    .pub-nav a.active { color: var(--color-primary); }

    .mobile-toggle { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 40px; height: 40px; background: var(--color-primary-soft); border: none; border-radius: 10px; cursor: pointer; padding: 0; }
    .mobile-toggle span { display: block; width: 18px; height: 2px; background: var(--color-primary-dark); border-radius: 2px; transition: transform .25s ease, opacity .25s ease; }
    .mobile-toggle.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .mobile-toggle.active span:nth-child(2) { opacity: 0; }
    .mobile-toggle.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-overlay { position: fixed; inset: 0; background: rgba(20,23,26,.5); backdrop-filter: blur(2px); z-index: 90; opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s ease; }
    .mobile-overlay.active { opacity: 1; visibility: visible; }
    .mobile-drawer { position: fixed; top: 0; right: -100%; width: 82%; max-width: 320px; height: 100vh; height: 100dvh; background: #fff; z-index: 100; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(20,23,26,.15); transition: right .35s cubic-bezier(.4,0,.2,1); }
    .mobile-drawer.active { right: 0; }
    .mobile-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
    .mobile-close { width: 34px; height: 34px; border-radius: 10px; background: var(--color-primary-soft); color: var(--color-primary-dark); border: none; font-size: 1.3rem; line-height: 1; cursor: pointer; }
    .mobile-nav { display: flex; flex-direction: column; padding: 12px; gap: 4px; }
    .mobile-nav a { padding: 13px 14px; border-radius: 12px; }
    .mobile-nav a.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .mobile-actions { margin-top: auto; padding: 16px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 10px; }

    .pub-footer { background: var(--color-text); color: #c9cdd1; padding: 40px 0; margin-top: 40px; }
    .foot-top { padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.1); flex-wrap: wrap; gap: 12px; }
    .foot-copy { margin-top: 20px; font-size: .85rem; color: var(--color-muted); }

    @media (max-width: 900px) {
      .pub-nav, .pub-actions { display: none; }
      .mobile-toggle { display: flex; }
      .pub-header.scrolled { margin: 8px 10px 0; }
    }
  `],
})
export class PublicLayoutComponent {
  auth = inject(AuthRepository);
  year = new Date().getFullYear();

  scrolled = signal(false);
  mobileOpen = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }

  toggleMobile(): void { this.mobileOpen.update((v) => !v); }
  closeMobile(): void { this.mobileOpen.set(false); }
}
