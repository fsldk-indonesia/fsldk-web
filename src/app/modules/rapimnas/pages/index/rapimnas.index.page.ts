import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { RapimnasCountdownComponent } from '../../components/rapimnas-countdown.component';
import { RapimnasPublic } from '../../entities/rapimnas';
import { rapimnasPath } from '../../rapimnas.path';
import { RapimnasIndexPresenter } from './rapimnas.index.presenter';
import { RapimnasIndexView } from './rapimnas.index.view';

@Component({
  selector: 'app-rapimnas-index-page',
  standalone: true,
  templateUrl: './rapimnas.index.page.html',
  imports: [RouterLink, IconComponent, RapimnasCountdownComponent],
  providers: [RapimnasIndexPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-hero { position: relative; min-height: calc(100vh - 73px); display: flex; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
    .rp-hero-bg { position: absolute; inset: 0; z-index: 0; }
    .rp-hero-bg-img { width: 100%; height: 100%; object-fit: cover; }
    .rp-hero-bg-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, color-mix(in srgb, var(--rp-merah) 70%, transparent), var(--rp-bg)); }
    .rp-hero-content { position: relative; z-index: 1; max-width: 960px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; align-items: center; }
    .rp-hero-badge { background: color-mix(in srgb, var(--rp-merah) 60%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.72rem; font-weight: 700; padding: 8px 18px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; }
    .rp-hero-title { font-size: 2rem; font-weight: 800; color: #fff; margin: 0 0 16px; line-height: 1.3; }
    .rp-hero-tagline { font-style: italic; color: var(--rp-krem); opacity: .85; margin: 0 0 8px; }
    .rp-hero-date { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.95rem; margin: 4px 0 0; }
    .rp-hero-actions { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .rp-btn { padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; }
    .rp-btn-primary { background: var(--rp-oranye); color: var(--rp-maroon); }
    .rp-btn-primary:hover { background: var(--rp-kuning); }
    .rp-btn-ghost { background: color-mix(in srgb, var(--rp-merah) 50%, transparent); color: var(--rp-krem); border: 1px solid color-mix(in srgb, var(--rp-krem) 30%, transparent); }
    .rp-section { max-width: 960px; margin: 0 auto; padding: 64px 16px; }
    .rp-section-title { font-size: 1.75rem; font-weight: 700; color: var(--rp-krem); text-align: center; margin: 0 0 24px; }
    .rp-section-head { text-align: center; margin-bottom: 40px; }
    .rp-section-sub { color: color-mix(in srgb, var(--rp-krem) 70%, transparent); margin-top: 8px; }
    .rp-section-cta { text-align: center; margin-top: 40px; }
    .rp-link-accent { color: var(--rp-oranye); font-weight: 700; text-decoration: none; }
    .rp-link-outline { display: inline-flex; padding: 12px 24px; border: 1px solid color-mix(in srgb, var(--rp-oranye) 50%, transparent); color: var(--rp-oranye); border-radius: 999px; text-decoration: none; }
    .rp-about-card { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 30%, transparent); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; gap: 40px; }
    .rp-about-text h2 { color: var(--rp-krem); font-size: 1.5rem; margin: 0 0 16px; }
    .rp-about-text p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); line-height: 1.7; margin: 0 0 24px; }
    .rp-about-features { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .rp-feature-card { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 20%, transparent); border-radius: 16px; padding: 24px; color: var(--rp-oranye); }
    .rp-feature-card-offset { margin-top: 24px; }
    .rp-feature-title { color: var(--rp-krem); font-weight: 700; margin-top: 12px; }
    .rp-feature-desc { color: color-mix(in srgb, var(--rp-krem) 60%, transparent); font-size: 0.78rem; margin: 4px 0 0; }
    .rp-gallery { position: relative; }
    .rp-gallery-track { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 24px; scroll-snap-type: x mandatory; scrollbar-width: none; }
    .rp-gallery-track::-webkit-scrollbar { display: none; }
    .rp-gallery-item { position: relative; min-width: 85%; height: 260px; border-radius: 24px; overflow: hidden; flex-shrink: 0; scroll-snap-align: center; cursor: pointer; border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); }
    .rp-gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    .rp-gallery-arrow { display: none; position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--rp-oranye); background: var(--rp-bg); color: var(--rp-oranye); cursor: pointer; }
    .rp-gallery-arrow-left { left: -20px; } .rp-gallery-arrow-right { right: -20px; }
    .rp-home-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .rp-home-card { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 30%, transparent); padding: 24px; border-radius: 24px; color: var(--rp-oranye); }
    .rp-home-card h3 { color: var(--rp-krem); font-size: 1.05rem; margin: 8px 0; }
    .rp-home-card p { color: color-mix(in srgb, var(--rp-krem) 60%, transparent); font-size: 0.85rem; margin: 0; }
    .rp-cta-card { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--rp-maroon), color-mix(in srgb, var(--rp-maroon) 60%, black)); border: 1px solid var(--rp-merah); border-radius: 40px; padding: 48px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 32px; }
    .rp-cta-text h2 { color: var(--rp-krem); font-size: 1.75rem; margin: 0 0 16px; }
    .rp-cta-text p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); margin: 0 0 24px; max-width: 480px; }
    .rp-cta-mascot { width: 220px; flex-shrink: 0; }
    .rp-cta-mascot img { width: 100%; }
    .rp-lightbox { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.9); display: flex; align-items: center; justify-content: center; padding: 40px; cursor: zoom-out; }
    .rp-lightbox-img { max-width: 100%; max-height: 100%; object-fit: contain; cursor: default; }
    .rp-lightbox-close { position: absolute; top: 24px; right: 24px; background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer; }
    @media (min-width: 768px) {
      .rp-hero-title { font-size: 3rem; }
      .rp-about-card { flex-direction: row; align-items: center; }
      .rp-gallery-arrow { display: flex; align-items: center; justify-content: center; }
      .rp-home-cards { grid-template-columns: repeat(4, 1fr); }
    }
  `],
})
export class RapimnasIndexPage implements OnInit, RapimnasIndexView {
  private presenter = inject(RapimnasIndexPresenter);

  readonly path = rapimnasPath;
  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);
  selectedImage = signal<string | null>(null);

  @ViewChild('carousel') private carouselRef?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }

  scrollGallery(direction: 'left' | 'right'): void {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    const amount = window.innerWidth > 768 ? 600 : 300;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  openLightbox(url: string): void { this.selectedImage.set(url); }
  closeLightbox(): void { this.selectedImage.set(null); }
}
