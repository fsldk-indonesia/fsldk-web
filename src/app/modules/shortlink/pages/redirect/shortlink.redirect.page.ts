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
