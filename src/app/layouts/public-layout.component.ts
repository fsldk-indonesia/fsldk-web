import { Component, HostListener, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { IconComponent } from '../shared/icon.component';

/**
 * Layout Landing Page publik: navbar mengikuti alur halaman di posisi atas,
 * baru berubah jadi kartu mengambang (position: fixed) setelah melewati
 * ambang scroll — bukan sticky sejak awal — plus drawer mobile + konten + footer.
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="page-shell">
    <div class="nav-placeholder" [class.active]="scrolled()"></div>
    <header class="pub-header" [class.scrolled]="scrolled()">
      <div class="container flex items-center justify-between">
        <a routerLink="/" class="brand" (click)="closeMobile()">
          <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img">
          <span class="brand-text">FSLDK <b>Indonesia</b></span>
        </a>

        <nav class="pub-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Beranda</a>
          <a routerLink="/berita" routerLinkActive="active">Berita</a>
          <a routerLink="/artikel" routerLinkActive="active">Artikel</a>
        </nav>

        <div class="flex items-center gap-sm pub-actions">
          @if (auth.isLoggedIn()) {
            <div class="user-fun-wrap" (mouseenter)="openUserMenu()" (mouseleave)="closeUserMenu()">
              <button class="btn btn-outline btn-sm btn-user-fun account-chip" type="button" (click)="toggleUserMenu($event)">
                @if (auth.user()?.photoURL) {
                  <img class="chip-avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
                } @else {
                  <span class="chip-avatar">{{ initials() }}</span>
                }
                {{ auth.user()?.fullName }}
              </button>
              <div class="dropdown-fun" [class.open]="userMenuOpen()">
                @if (auth.hasAnyCmsAccess()) {
                  <a routerLink="/cms/dashboard" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="dashboard" [size]="16" />Masuk CMS</a>
                }
                <button type="button" class="dropdown-fun-item" (click)="logout()"><app-icon name="log-out" [size]="16" />Keluar</button>
              </div>
            </div>
          } @else {
            <div class="user-fun-wrap" (mouseenter)="openUserMenu()" (mouseleave)="closeUserMenu()">
              <button class="btn btn-outline btn-sm btn-user-fun account-chip" type="button" (click)="toggleUserMenu($event)">
                <span class="chip-avatar guest"><app-icon name="guest" [size]="15" /></span> Pengunjung
              </button>
              <div class="dropdown-fun" [class.open]="userMenuOpen()">
                <a routerLink="/login" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="log-in" [size]="16" />Masuk</a>
                <a routerLink="/daftar" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="user-plus" [size]="16" />Daftar</a>
              </div>
            </div>
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
          <span class="brand-text">FSLDK <b>Indonesia</b></span>
        </a>
        <button class="mobile-close" (click)="closeMobile()" aria-label="Tutup menu">&times;</button>
      </div>
      <nav class="mobile-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobile()">Beranda</a>
        <a routerLink="/berita" routerLinkActive="active" (click)="closeMobile()">Berita</a>
        <a routerLink="/artikel" routerLinkActive="active" (click)="closeMobile()">Artikel</a>
      </nav>
      <div class="mobile-actions">
        @if (auth.isLoggedIn()) {
          <div class="mobile-account">
            @if (auth.user()?.photoURL) {
              <img class="chip-avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
            } @else {
              <span class="chip-avatar">{{ initials() }}</span>
            }
            {{ auth.user()?.fullName }}
          </div>
          @if (auth.hasAnyCmsAccess()) {
            <a routerLink="/cms/dashboard" class="btn btn-primary btn-block" (click)="closeMobile()"><app-icon name="dashboard" [size]="17" />Masuk CMS</a>
          }
          <button type="button" class="btn btn-outline btn-block" (click)="logout(); closeMobile()"><app-icon name="log-out" [size]="17" />Keluar</button>
        } @else {
          <div class="mobile-account"><span class="chip-avatar guest"><app-icon name="guest" [size]="15" /></span> Pengunjung</div>
          <a routerLink="/login" class="btn btn-outline btn-block" (click)="closeMobile()"><app-icon name="log-in" [size]="17" />Masuk</a>
          <a routerLink="/daftar" class="btn btn-primary btn-block" (click)="closeMobile()"><app-icon name="user-plus" [size]="17" />Daftar</a>
        }
      </div>
    </aside>

    <main><router-outlet /></main>

    <footer class="pub-footer pattern-motif pattern-motif-dark">
      <div class="container">
        <div class="flex items-center justify-between foot-top">
          <span class="brand-text light">FSLDK <b>Indonesia</b></span>
          <span class="foot-tagline">
            <svg class="foot-glyph" width="34" height="26" viewBox="0 0 34 26" aria-hidden="true">
              <path class="network-line" d="M17,13 L4,4 M17,13 L4,22 M17,13 L30,4 M17,13 L30,22" style="stroke:rgba(255,255,255,.35)" />
              <circle class="network-node" cx="17" cy="13" r="4" />
              <circle class="network-node gold" cx="4" cy="4" r="2.3" style="animation-delay:.3s" />
              <circle class="network-node ember" cx="4" cy="22" r="2.3" style="animation-delay:.6s" />
              <circle class="network-node gold" cx="30" cy="4" r="2.3" style="animation-delay:.9s" />
              <circle class="network-node ember" cx="30" cy="22" r="2.3" style="animation-delay:1.2s" />
            </svg>
            Menyatukan Langkah Dakwah Kampus se-Indonesia
          </span>
        </div>

        <nav class="foot-social" aria-label="Media sosial FSLDK Indonesia">
          @for (s of socialLinks; track s.href) {
            <a [href]="s.href" target="_blank" rel="noopener" class="foot-social-link">
              <app-icon [name]="s.icon" [size]="15" />{{ s.handle }}
            </a>
          }
        </nav>

        <p class="foot-copy">&copy; {{ year }} Perkumpulan Forum Silaturahmi Lembaga Dakwah Kampus Indonesia. Sejak 1986.</p>
      </div>
    </footer>
    </div>
  `,
  styles: [`
    /* Sengaja TIDAK memaksa main mengisi 100dvh penuh. Percobaan sebelumnya
       (main{flex:1 0 auto} + page-shell{min-height:100dvh}) membuat total
       tinggi halaman berkonten pendek (mis. hasil pencarian kosong) mendarat
       PAS di 100dvh, sehingga jarak yang bisa di-scroll jadi nyaris nol.
       Browser menangani jarak scroll yang nyaris-nol itu dengan buruk saat
       scroll momentum/trackpad — terasa "tersangkut"/tidak bisa mentok ke
       bawah. Alur dokumen biasa di sini menghindari itu; konsekuensinya
       halaman yang sangat pendek bisa punya sedikit ruang kosong di bawah
       footer, yang jauh lebih ringan daripada scroll yang terasa rusak. */
    .page-shell { min-height: 100dvh; }

    /* Mengikuti pola ldksyahid-app: header normal (ikut alur halaman, ikut ter-scroll)
       di posisi atas, baru berubah jadi kartu mengambang (position: fixed) setelah
       melewati ambang scroll tertentu — bukan sticky sejak piksel pertama. */
    .nav-placeholder { height: 0; transition: height .2s ease; }
    .nav-placeholder.active { height: 78px; }

    .pub-header { position: relative; top: 0; left: 0; width: 100%; z-index: 60; background: rgba(255,255,255,.9); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--color-border); padding: 16px 0; }
    .pub-header.scrolled {
      position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
      width: min(1180px, calc(100% - 32px));
      border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); background: #fff; padding: 10px 8px;
      animation: navFadeIn .25s ease;
    }
    @keyframes navFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand:hover { text-decoration: none; }
    .brand-logo-img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; transition: transform .2s ease; }
    .brand:hover .brand-logo-img { transform: rotate(-4deg) scale(1.04); }
    .brand-logo-img.sm { width: 36px; height: 36px; }
    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text b { color: var(--color-primary); display: inline; }
    .brand-text.light { color: #fff; } .brand-text.light b { color: var(--color-primary-bright); }

    .pub-nav { display: flex; gap: 28px; }
    .pub-nav a, .mobile-nav a { position: relative; display: flex; align-items: center; gap: 7px; color: var(--color-text); font-weight: 600; transition: color var(--motion-fast) ease; }
    .pub-nav a svg, .mobile-nav a svg { opacity: .75; }
    .pub-nav a.active svg, .mobile-nav a.active svg { opacity: 1; }
    .pub-nav a:hover, .mobile-nav a:hover { text-decoration: none; color: var(--color-primary-dark); }
    .pub-nav a { font-size: .95rem; }
    .pub-nav a.active { color: var(--color-primary); }
    /* Titik emas kecil di bawah tautan aktif — berdenyut halus, gema dari
       simpul jaringan di hero, bukan garis bawah statis biasa. */
    .pub-nav a.active::after {
      content: ""; position: absolute; left: 50%; bottom: -9px; width: 5px; height: 5px;
      margin-left: -2.5px; border-radius: 50%; background: var(--color-gold);
      animation: node-pulse 2.4s ease-in-out infinite;
    }
    .pub-nav a:focus-visible, .mobile-nav a:focus-visible, .btn-user-fun:focus-visible, .mobile-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; border-radius: var(--radius-xs); }

    .user-fun-wrap { position: relative; }
    .btn-user-fun { border: none; cursor: pointer; font-family: var(--font-body); }
    .account-chip { display: flex; align-items: center; gap: 8px; }
    .chip-avatar { width: 24px; height: 24px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; }
    .chip-avatar.guest { background: var(--color-bg-alt); color: var(--color-text-secondary); }
    img.chip-avatar { object-fit: cover; }
    /* Tumbuh dari sudut kanan-atas (persis di ujung tombol akun yang
       memicunya) — bukan cuma translateY, supaya terasa "ditarik keluar"
       dari tombol, bukan muncul lepas dari langit-langit. */
    .dropdown-fun {
      position: absolute; right: 0; top: 100%; margin-top: 8px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 180px; padding: 8px;
      opacity: 0; visibility: hidden; transform-origin: top right; transform: scale(.85) translateY(-4px);
      transition: opacity var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out), visibility var(--motion-base);
      z-index: 70;
    }
    .dropdown-fun-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 12px; border-radius: var(--radius-xs); border: none; background: none; color: var(--color-text); font-family: var(--font-body); font-weight: 600; font-size: .9rem; white-space: nowrap; cursor: pointer; transition: background var(--motion-fast) ease; }
    .dropdown-fun-item svg { opacity: .7; flex-shrink: 0; }
    .dropdown-fun-item:hover { background: var(--color-bg-warm); text-decoration: none; }
    .dropdown-fun.open { opacity: 1; visibility: visible; transform: scale(1) translateY(0); }
    @media (prefers-reduced-motion: reduce) { .dropdown-fun { transition: opacity var(--motion-base) ease, visibility var(--motion-base); transform: none !important; } }
    .mobile-account { display: flex; align-items: center; gap: 10px; padding: 8px 4px; font-weight: 600; color: var(--color-text); }

    .mobile-toggle { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 40px; height: 40px; background: var(--color-primary-soft); border: none; border-radius: var(--radius-xs); cursor: pointer; padding: 0; }
    .mobile-toggle span { display: block; width: 18px; height: 2px; background: var(--color-primary-dark); border-radius: 2px; transition: transform .25s ease, opacity .25s ease; }
    .mobile-toggle.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .mobile-toggle.active span:nth-child(2) { opacity: 0; }
    .mobile-toggle.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-overlay { position: fixed; inset: 0; background: rgba(20,23,26,.5); backdrop-filter: blur(2px); z-index: 90; opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s ease; }
    .mobile-overlay.active { opacity: 1; visibility: visible; }
    .mobile-drawer { position: fixed; top: 0; right: -100%; width: 82%; max-width: 320px; height: 100vh; height: 100dvh; background: #fff; z-index: 100; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(20,23,26,.15); transition: right .35s cubic-bezier(.4,0,.2,1); }
    .mobile-drawer.active { right: 0; }
    .mobile-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
    .mobile-close { width: 34px; height: 34px; border-radius: var(--radius-xs); background: var(--color-primary-soft); color: var(--color-primary-dark); border: none; font-size: 1.3rem; line-height: 1; cursor: pointer; }
    .mobile-nav { display: flex; flex-direction: column; padding: 12px; gap: 4px; }
    .mobile-nav a { padding: 13px 14px; border-radius: var(--radius-md); }
    .mobile-nav a.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .mobile-actions { margin-top: auto; padding: 16px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 10px; }

    /* Tanpa margin-top: margin ada DI LUAR background gelap footer, jadi
       kalau diberi jarak lewat margin, warna putih halaman di belakangnya
       akan terlihat sebagai garis/celah putih tepat sebelum footer.
       Jarak sebelum footer sudah cukup dari padding section di atasnya. */
    .pub-footer { background: var(--color-text); color: #c9cdd1; padding: 40px 0; }
    .foot-top { padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.1); flex-wrap: wrap; gap: 12px; }
    .foot-tagline { display: flex; align-items: center; gap: 10px; }
    .foot-glyph { flex-shrink: 0; overflow: visible; }
    .foot-social { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
    .foot-social-link {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px;
      border-radius: var(--radius-full); background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
      color: #fff; font-weight: 600; font-size: .82rem;
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .foot-social-link app-icon { color: var(--color-primary-bright); }
    .foot-social-link:hover { background: rgba(255,255,255,.14); border-color: var(--color-gold); text-decoration: none; transform: translateY(-2px); }
    .foot-copy { margin-top: 20px; font-size: .85rem; color: var(--color-muted); }

    @media (max-width: 900px) {
      .pub-nav, .pub-actions { display: none; }
      .mobile-toggle { display: flex; }
      .pub-header { padding: 12px 0; }
      .pub-header.scrolled { top: 10px; width: calc(100% - 24px); padding: 8px 6px; }
      .nav-placeholder.active { height: 64px; }
    }
  `],
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthRepository);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  year = new Date().getFullYear();

  readonly socialLinks = [
    { icon: 'instagram', handle: 'fsldkindonesia', href: 'https://instagram.com/fsldkindonesia' },
    { icon: 'facebook', handle: 'fsldkindonesia', href: 'https://facebook.com/fsldkindonesia' },
    { icon: 'tiktok', handle: 'fsldkindonesia', href: 'https://tiktok.com/@fsldkindonesia' },
    { icon: 'x-twitter', handle: 'fsldkindonesia_', href: 'https://x.com/fsldkindonesia_' },
    { icon: 'youtube', handle: 'fsldkindonesia5655', href: 'https://youtube.com/@fsldkindonesia5655' },
  ];

  scrolled = signal(false);
  mobileOpen = signal(false);
  userMenuOpen = signal(false);

  // Dipasang manual di luar zone Angular (bukan @HostListener('window:scroll'))
  // supaya event scroll yang sangat sering ini tidak memicu change detection
  // di SETIAP tick — zone hanya dimasuki lagi saat status "scrolled" benar-
  // benar berpindah (melewati ambang 80px). @HostListener selalu berjalan
  // di dalam zone, jadi setiap event scroll sebelumnya memicu satu siklus
  // CD penuh meski nilainya tidak berubah.
  private onScroll = (): void => {
    const isScrolled = window.scrollY > 80;
    if (isScrolled !== this.scrolled()) {
      this.ngZone.run(() => this.scrolled.set(isScrolled));
    }
  };

  ngOnInit(): void {
    // Sinkronkan sekali di awal — kalau halaman dibuka/di-refresh saat
    // browser sudah memulihkan posisi scroll sebelumnya (scroll restoration),
    // tidak ada event "scroll" baru yang terpicu untuk memberi tahu kita,
    // jadi tanpa baris ini status header bisa "nyangkut" salah sampai
    // pengguna scroll lagi.
    if (window.scrollY > 80) this.scrolled.set(true);
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.userMenuOpen.set(false);
  }

  toggleMobile(): void { this.mobileOpen.update((v) => !v); }
  closeMobile(): void { this.mobileOpen.set(false); }

  openUserMenu(): void { this.userMenuOpen.set(true); }
  closeUserMenu(): void { this.userMenuOpen.set(false); }
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
