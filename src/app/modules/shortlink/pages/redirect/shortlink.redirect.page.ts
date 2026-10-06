import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { PageLoaderComponent } from '../../../../shared/page-loader.component';
import { ShortlinkRedirectPresenter } from './shortlink.redirect.presenter';
import { ShortlinkRedirectView } from './shortlink.redirect.view';

/**
 * Halaman catch-all publik (rute `/:key`, tanpa layout) yang me-resolve
 * kunci shortlink ke URL tujuan lewat backend, lalu redirect di sisi
 * browser — sehingga shortlink yang dibagikan memakai domain frontend
 * (mis. fsldk-indonesia.com/promo2026), bukan domain backend.
 */
@Component({
  selector: 'app-shortlink-redirect-page',
  standalone: true,
  templateUrl: './shortlink.redirect.page.html',
  imports: [RouterLink, IconComponent, PageLoaderComponent],
  providers: [ShortlinkRedirectPresenter],
  styles: [`
    /* Backdrop — gradien hijau tua diagonal + glow radial emas + tekstur
       titik, disalin PERSIS dari .auth-wash milik AuthLayoutComponent
       (halaman ini tidak bersarang di shell manapun — lihat app.routes.ts
       — jadi backdropnya harus dibawa sendiri). */
    .redirect-wash {
      position: relative; overflow: hidden;
      min-height: 100dvh;
      display: flex; align-items: center; justify-content: center;
      padding: 28px 24px;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
    }
    .redirect-wash::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }
    .redirect-texture {
      position: absolute; inset: 0; z-index: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }
    .redirect-card {
      position: relative; z-index: 1; box-sizing: border-box;
      width: 100%; max-width: 400px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: 0 24px 50px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.6);
      padding: 40px 32px;
    }

    /* Konten state error — satu momen kemunculan (fade + rise halus) saat
       resolve shortlink gagal dan kartu beralih dari loader ke pesan ini. */
    .error-content { animation: redirect-card-in .4s var(--ease-out, ease) both; }
    @keyframes redirect-card-in { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
    .error-content .icon-badge { margin: 0 auto 18px; }
    .error-content h4 { font-size: 1.3rem; letter-spacing: -.01em; margin-bottom: 10px; }
    .error-content p { font-size: .92rem; line-height: 1.6; margin-bottom: 28px; }
    @media (prefers-reduced-motion: reduce) { .error-content { animation: none; } }

    @media (max-width: 480px) {
      .redirect-wash { padding: 20px 16px; }
      .redirect-card { padding: 30px 24px; }
    }
  `],
})
export class ShortlinkRedirectPage implements OnInit, ShortlinkRedirectView {
  private presenter = inject(ShortlinkRedirectPresenter);
  private route = inject(ActivatedRoute);

  notFound = signal(false);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.resolve(this.route.snapshot.paramMap.get('key')!);
  }

  setNotFound(): void { this.notFound.set(true); }
}
