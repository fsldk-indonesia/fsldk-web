import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer.component';
import { AuthRepository } from '../modules/user/repositories/auth.repository';

/**
 * Layout Landing Page publik: navbar + footer (app-site-header/app-site-footer,
 * shared/ — dipakai identik juga oleh KaderLayoutComponent, lihat miss-
 * development-prompt-2.md poin 4) membingkai konten publik apa adanya.
 *
 * authGuard/isLoggedIn() di seluruh app HANYA baca state lokal (signal/
 * localStorage) — tidak pernah memvalidasi token ke backend (lihat guards.ts).
 * Rute publik ini juga sama sekali tidak dijaga guard apa pun (memang harus
 * publik). Akibatnya sesi yang sudah kedaluwarsa di backend TIDAK PERNAH
 * ketahuan selama pengguna cuma diam di halaman publik/root — site-header
 * tetap menampilkan UI "sudah login" basi, baru benar-benar ter-logout saat
 * pengguna masuk ke satu portal CMS yang langsung memicu request API
 * ber-otentikasi (dan gagal 401 → error.interceptor.ts yang men-logout).
 * Fix: sekali saat layout publik ini pertama dimuat (bukan tiap child route
 * berganti — komponen ini instance tunggal yang dipakai ulang), refresh
 * sesi via endpoint yang SAMA dipakai verifiedGuard (POST /auth/refresh-token,
 * lihat auth.repository.ts refreshSession()). Kalau refresh token masih sah,
 * ini cuma diam-diam memperbarui access token (silent refresh, tidak
 * mengganggu pengguna). Kalau sudah benar-benar kedaluwarsa/dicabut,
 * responsnya 401 dan error.interceptor.ts men-trigger logout+redirect ke
 * /login secara otomatis — jalur yang sama persis dengan yang sudah dipakai
 * di seluruh app, tidak menambah mekanisme baru.
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    <div class="page-shell">
      <app-site-header />
      <main><router-outlet /></main>
      <app-site-footer />
    </div>
  `,
  styles: [`
    /* Sticky footer klasik: shell jadi flex column setinggi viewport, main
       mengambil sisa ruang (flex:1) supaya footer selalu menempel ke bawah
       walau kontennya pendek (mis. halaman verifikasi email) — sebelumnya
       footer tidak flex-grow sehingga menyisakan celah putih di bawah
       footer pada halaman pendek (miss-development-prompt-2.md poin 3). */
    .page-shell { min-height: 100dvh; display: flex; flex-direction: column; }
    main { flex: 1; }
  `],
})
export class PublicLayoutComponent implements OnInit {
  private auth = inject(AuthRepository);

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) this.auth.refreshSession().subscribe({ error: () => {} });
  }
}
