import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon.component';

/**
 * Layout Portal Kader — shell SENDIRI tanpa navbar/footer landing page sama
 * sekali (bahasa visual disalin dari AuthLayoutComponent: gradien hijau tua
 * diagonal + glow radial emas + tekstur titik), BUKAN lagi app-site-header/
 * app-site-footer di atas sidebar. Satu-satunya jalan keluar adalah tautan
 * "Kembali ke Beranda" di sidebar (tidak ada navbar).
 *
 * `<router-outlet>` dibungkus `.kader-page-shell` — kartu putih bulat, pola
 * & rule flatten `.page-head + .card`-nya SAMA PERSIS dengan `.page-shell`
 * milik CmsLayoutComponent (lihat komentar di sana) — supaya Formulir
 * Pendataan & Status Pendataan (komponen yang SAMA dipakai ulang oleh
 * cms-ldk/cms-puskomda/cms-puskomnas untuk Levelisasi LDK, lihat
 * submission.routes.ts) duduk rapi di kartu ini TANPA perlu diubah sama
 * sekali — mencegah tampilan card-di-dalam-card tanpa menyentuh komponen
 * yang dipakai bersama lintas shell itu.
 */
@Component({
  selector: 'app-kader-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="kader-shell">
      <div class="kader-texture" aria-hidden="true"></div>
      <div class="kader-body">
        <aside class="kader-sidebar">
          <nav class="kader-nav">
            <a routerLink="/kader/ringkasan" routerLinkActive="active">
              <app-icon name="dashboard" [size]="16" /> Ringkasan
            </a>
            <a routerLink="/kader/pendataan" routerLinkActive="active">
              <app-icon name="clipboard-list" [size]="16" /> Formulir Pendataan
            </a>
            <a routerLink="/kader/status" routerLinkActive="active">
              <app-icon name="list-checks" [size]="16" /> Status Pendataan
            </a>
          </nav>
          <a routerLink="/" class="kader-back"><app-icon name="arrow-left" [size]="13" /> Kembali ke Beranda</a>
        </aside>
        <main class="kader-content"><div class="kader-page-shell"><router-outlet /></div></main>
      </div>
    </div>
  `,
  styles: [`
    /* Backdrop — disalin persis dari AuthLayoutComponent (.auth-wash/.auth-texture). */
    .kader-shell {
      /* overflow:hidden sengaja TIDAK dipakai di sini (beda dari AuthLayoutComponent
         yang jadi sumber kopi) — overflow selain visible pada ancestor manapun
         mematahkan position:sticky milik .kader-sidebar di bawah (jadi no-op,
         sidebar ikut ter-scroll biasa). Tidak perlu untuk clipping karena
         .kader-texture & ::after sudah inset:0 pas dengan box ini sendiri. */
      position: relative; min-height: 100dvh;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    .kader-shell::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    .kader-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }

    .kader-body {
      position: relative; z-index: 1; box-sizing: border-box; min-height: 100dvh;
      display: flex; align-items: flex-start; max-width: 1180px; width: 100%; margin: 0 auto;
      padding: 40px 20px 56px; gap: 28px;
    }

    /* Sidebar "kaca" — translucent di atas backdrop gelap, bukan kartu putih
       solid seperti sebelumnya (yang akan kontras aneh di atas gradien hijau tua). */
    .kader-sidebar {
      width: 240px; flex-shrink: 0; position: sticky; top: 32px;
      background: rgba(255,255,255,.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.18); border-radius: var(--radius-lg); padding: 18px;
    }
    .kader-nav { display: flex; flex-direction: column; gap: 4px; }
    .kader-nav a { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 12px; border-radius: var(--radius-md); color: rgba(255,255,255,.82); font-weight: 600; font-size: .92rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .kader-nav a:hover { background: rgba(255,255,255,.14); color: #fff; text-decoration: none; }
    .kader-nav a.active { background: #fff; color: var(--color-primary-dark); box-shadow: var(--shadow-sm); }
    /* Divider memisahkan "Kembali ke Beranda" dari tab nav di atasnya secara visual —
       ini exit-link ke luar portal, bukan tab ke-4, jadi sengaja tidak dibuat pill. */
    .kader-back { display: flex; align-items: center; gap: 8px; min-height: 44px; margin-top: 12px; padding: 12px 4px 0; border-top: 1px solid rgba(255,255,255,.16); color: rgba(255,255,255,.62); font-weight: 600; font-size: .85rem; }
    .kader-back:hover { color: #fff; text-decoration: none; }

    .kader-content { flex: 1; min-width: 0; }

    /* Kartu putih pembungkus konten — pola & rule flatten SAMA dengan
       .page-shell milik CmsLayoutComponent, lihat komentar kelas di atas. */
    .kader-page-shell {
      background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 28px;
    }
    .kader-page-shell ::ng-deep .page-head + .card {
      background: transparent; border: none; box-shadow: none;
    }

    @media (max-width: 900px) {
      .kader-body { flex-direction: column; padding: 24px 16px 40px; }
      /* Sidebar berhenti jadi panel kaca di mobile — nav-nya sendiri yang
         jadi floating tab bar (fixed, lihat .kader-nav di bawah), jadi
         bungkus panel lama cuma bikin kotak kaca kosong di sekeliling
         "Kembali ke Beranda" saja. */
      .kader-sidebar {
        width: 100%; position: static; padding: 0; background: none; border: none;
        backdrop-filter: none; -webkit-backdrop-filter: none; box-shadow: none;
      }
      .kader-nav {
        position: fixed; top: 12px; left: 16px; right: 16px; z-index: 40;
        flex-direction: row; flex-wrap: nowrap; gap: 4px; padding: 6px;
        background: rgba(10,54,36,.75); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.22); border-radius: var(--radius-md); box-shadow: var(--shadow-md);
      }
      /* 3 tab lebar sama rata (flex:1, bukan scroll horizontal) supaya label
         selalu utuh kebaca, tak pernah kepotong di tepi layar — ikon di atas,
         label boleh patah 2 baris ("Formulir Pendataan" dsb), bukan nowrap. */
      .kader-nav a {
        flex: 1 1 0; min-width: 0; flex-direction: column; gap: 2px;
        text-align: center; white-space: normal; font-size: .72rem; line-height: 1.2;
        padding: 8px 4px; min-height: 56px;
      }
      /* Beri jarak sebesar tinggi nav fixed (padding 12 + tab 56 + top-offset 12 + napas),
         supaya back-link tidak ketutup nav yang mengambang di atasnya. */
      .kader-back { margin-top: 88px; border-top: none; padding-top: 0; }
    }
    @media (max-width: 640px) { .kader-page-shell { padding: 18px; } }
  `],
})
export class KaderLayoutComponent {}
