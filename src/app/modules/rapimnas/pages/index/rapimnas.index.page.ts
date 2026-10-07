import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { RapimnasCountdownComponent } from '../../components/rapimnas-countdown.component';
import { RapimnasPublic } from '../../entities/rapimnas';
import { RapimnasRevealDirective } from '../../rapimnas-reveal.directive';
import { rapimnasPath } from '../../rapimnas.path';
import { RapimnasIndexPresenter } from './rapimnas.index.presenter';
import { RapimnasIndexView } from './rapimnas.index.view';

@Component({
  selector: 'app-rapimnas-index-page',
  standalone: true,
  templateUrl: './rapimnas.index.page.html',
  imports: [RouterLink, IconComponent, RapimnasCountdownComponent, RapimnasRevealDirective],
  providers: [RapimnasIndexPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(0.16,1,0.3,1), transform .8s cubic-bezier(0.16,1,0.3,1); }
    .rp-reveal.rp-revealed { opacity: 1; transform: none; }
    .rp-hero { position: relative; height: calc(100vh - 73px); display: flex; align-items: center; justify-content: center; text-align: center; }
    .rp-hero-bg { position: absolute; inset: 0; z-index: 0; }
    .rp-hero-bg-img { width: 100%; height: 100%; object-fit: cover; }
    .rp-hero-bg-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, color-mix(in srgb, var(--rp-maroon) 70%, transparent) 0%, color-mix(in srgb, var(--rp-maroon) 80%, transparent) 50%, var(--rp-bg) 100%); }
    .rp-hero-content { position: relative; z-index: 1; max-width: 1024px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
    .rp-hero-badge { display: block; color: var(--rp-kuning); font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 20px; text-shadow: 0 0 20px rgba(254,112,2,0.6); }
    .rp-hero-title { font-size: 1.875rem; font-weight: 800; color: #fff; margin: 0 0 16px; line-height: 1.375; filter: drop-shadow(0 10px 8px rgba(0,0,0,0.04)) drop-shadow(0 4px 3px rgba(0,0,0,0.1)); }
    .rp-hero-tagline { font-style: italic; color: var(--rp-krem); opacity: .85; margin: 0 0 8px; }
    .rp-hero-date { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.875rem; font-weight: 500; margin: 12px 0 0; }
    .rp-hero-actions { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .rp-btn { padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.875rem; text-decoration: none; display: inline-flex; align-items: center; transition: all 300ms; }
    .rp-btn-primary { background: var(--rp-oranye); color: var(--rp-maroon); box-shadow: 0 0 20px rgba(254,112,2,0.4); }
    .rp-btn-primary:hover { background: var(--rp-kuning); }
    .rp-btn-ghost { background: color-mix(in srgb, var(--rp-maroon) 60%, transparent); color: var(--rp-krem); backdrop-filter: blur(12px); font-weight: 500; border: 1px solid color-mix(in srgb, var(--rp-krem) 30%, transparent); }
    .rp-btn-ghost:hover { background: color-mix(in srgb, var(--rp-merah) 80%, transparent); border-color: var(--rp-oranye); }
    .rp-btn-cta { padding: 14px 24px; box-shadow: 0 5px 15px rgba(254,112,2,0.3); font-size: 1rem; }
    .rp-section { max-width: 960px; margin: 0 auto; padding: 64px 16px; }
    .rp-about { max-width: 1152px; scroll-margin-top: 80px; }
    .rp-gallery-section { max-width: 1280px; }
    .rp-cards-section { max-width: 1152px; }
    .rp-cta-section { max-width: 1024px; padding: 80px 16px; margin-bottom: 40px; }
    .rp-section-title { font-size: 1.875rem; font-weight: 700; color: var(--rp-krem); text-align: center; margin: 0; }
    .rp-section-title--underline { position: relative; display: inline-block; }
    .rp-section-title--underline::after { content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 64px; height: 6px; background: var(--rp-oranye); border-radius: 999px; }
    .rp-gallery-head { text-align: center; margin-bottom: 40px; }
    .rp-section-head { text-align: center; margin-bottom: 48px; }
    .rp-section-sub { color: color-mix(in srgb, var(--rp-krem) 70%, transparent); margin-top: 8px; }
    .rp-section-cta { text-align: center; margin-top: 40px; }
    .rp-link-accent { display: inline-flex; align-items: center; gap: 8px; color: var(--rp-oranye); font-weight: 600; text-decoration: none; transition: color 300ms; }
    .rp-link-accent:hover { color: var(--rp-kuning); }
    .rp-link-arrow { display: inline-block; transition: transform 300ms; }
    .rp-link-accent:hover .rp-link-arrow { transform: translateX(8px); }
    .rp-link-outline { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border: 1px solid color-mix(in srgb, var(--rp-oranye) 50%, transparent); color: var(--rp-oranye); border-radius: 999px; text-decoration: none; transition: background-color 300ms; }
    .rp-link-outline:hover { background: color-mix(in srgb, var(--rp-oranye) 10%, transparent); }
    .rp-about-card { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--rp-merah) 30%, transparent); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); transition: border-color 500ms; }
    .rp-about-card:hover { border-color: color-mix(in srgb, var(--rp-oranye) 40%, transparent); }
    .rp-about-text h2 { color: var(--rp-krem); font-size: 1.875rem; font-weight: 700; margin: 0 0 16px; }
    .rp-about-text p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); line-height: 1.625; margin: 0 0 24px; text-align: justify; }
    .rp-about-features { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
    .rp-feature-card { background: linear-gradient(to bottom right, color-mix(in srgb, var(--rp-merah) 20%, transparent), transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 20%, transparent); border-radius: 16px; padding: 24px; color: var(--rp-oranye); transition: transform 500ms; transition-delay: 75ms; }
    .rp-about-card:hover .rp-feature-card { transform: translateY(-8px); }
    .rp-feature-card-offset { margin-top: 24px; transition-delay: 150ms; background: linear-gradient(to bottom right, color-mix(in srgb, var(--rp-oranye) 20%, transparent), transparent); border-color: color-mix(in srgb, var(--rp-oranye) 20%, transparent); color: var(--rp-kuning); }
    .rp-feature-title { color: var(--rp-krem); font-weight: 700; margin-top: 12px; }
    .rp-feature-desc { color: color-mix(in srgb, var(--rp-krem) 60%, transparent); font-size: 0.75rem; margin: 4px 0 0; }
    .rp-gallery { position: relative; }
    .rp-gallery-track { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 32px; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; }
    .rp-gallery-track::-webkit-scrollbar { display: none; }
    .rp-gallery-item { position: relative; width: 85%; height: 256px; border-radius: 24px; overflow: hidden; flex-shrink: 0; scroll-snap-align: center; cursor: pointer; border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); }
    .rp-gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 700ms; }
    .rp-gallery-item:hover img { transform: scale(1.1); }
    .rp-gallery-overlay { position: absolute; inset: 0; background: color-mix(in srgb, var(--rp-bg) 0%, transparent); display: flex; align-items: center; justify-content: center; transition: background-color 300ms; }
    .rp-gallery-item:hover .rp-gallery-overlay { background: color-mix(in srgb, var(--rp-bg) 40%, transparent); }
    .rp-gallery-zoom-icon { width: 56px; height: 56px; border-radius: 50%; background: color-mix(in srgb, var(--rp-oranye) 90%, transparent); color: var(--rp-bg); display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.5); transition: all 300ms; box-shadow: 0 0 20px rgba(254,112,2,0.6); }
    .rp-gallery-item:hover .rp-gallery-zoom-icon { opacity: 1; transform: scale(1); }
    .rp-gallery-arrow { display: none; position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--rp-oranye); background: var(--rp-bg); color: var(--rp-oranye); cursor: pointer; opacity: 0; transition: opacity 300ms, background-color 300ms, color 300ms; box-shadow: 0 0 15px rgba(254,112,2,0.5); }
    .rp-gallery-arrow-left { left: -20px; } .rp-gallery-arrow-right { right: -20px; }
    .rp-gallery:hover .rp-gallery-arrow { opacity: 1; }
    .rp-gallery-arrow:hover { background: var(--rp-oranye); color: var(--rp-bg); }
    .rp-gallery-hint { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 8px; color: color-mix(in srgb, var(--rp-krem) 50%, transparent); font-size: 0.875rem; animation: rp-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
    @keyframes rp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .rp-home-cards { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .rp-home-card { background: color-mix(in srgb, var(--rp-maroon) 30%, transparent); backdrop-filter: blur(4px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); padding: 24px; border-radius: 24px; color: var(--rp-oranye); transition: background-color 300ms, transform 300ms; }
    .rp-home-card:hover { background: color-mix(in srgb, var(--rp-maroon) 60%, transparent); transform: translateY(-8px); }
    .rp-home-card h3 { color: var(--rp-krem); font-size: 1.125rem; font-weight: 700; margin: 8px 0; }
    .rp-home-card p { color: color-mix(in srgb, var(--rp-krem) 60%, transparent); font-size: 0.875rem; margin: 0; }
    .rp-cta-card { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--rp-maroon), #4a0316); border: 1px solid var(--rp-merah); border-radius: 40px; padding: 32px; display: flex; flex-direction: column; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 32px; box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
    .rp-cta-glow { position: absolute; top: -80px; right: -80px; width: 256px; height: 256px; background: color-mix(in srgb, var(--rp-oranye) 10%, transparent); border-radius: 50%; filter: blur(64px); pointer-events: none; }
    .rp-cta-text { position: relative; z-index: 1; flex: 1; text-align: center; }
    .rp-cta-text h2 { color: var(--rp-krem); font-size: 1.875rem; font-weight: 700; margin: 0 0 16px; }
    .rp-cta-text p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); margin: 0 auto 32px; max-width: 512px; }
    .rp-cta-mascot { position: relative; z-index: 1; width: 224px; flex-shrink: 0; margin-top: 24px; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5)); transition: transform 500ms; }
    .rp-cta-mascot:hover { transform: scale(1.05) rotate(-2deg); }
    .rp-cta-mascot img { width: 100%; display: block; }
    .rp-lightbox { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.9); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px; cursor: zoom-out; opacity: 0; transition: opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 320ms cubic-bezier(0.16, 1, 0.3, 1); }
    .rp-lightbox.open { opacity: 1; }
    .rp-lightbox-box { position: relative; width: 100%; max-width: 1280px; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); cursor: default; transform: scale(0.82); opacity: 0; transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms cubic-bezier(0.16, 1, 0.3, 1); }
    .rp-lightbox.open .rp-lightbox-box { transform: scale(1); opacity: 1; }
    .rp-lightbox-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .rp-lightbox-close { position: absolute; top: 24px; right: 24px; background: none; border: none; color: #fff; font-size: 2.25rem; line-height: 1; cursor: pointer; z-index: 110; transition: color 300ms, transform 300ms cubic-bezier(0.16, 1, 0.3, 1); opacity: 0; transform: translateY(-8px); }
    .rp-lightbox.open .rp-lightbox-close { opacity: 1; transform: none; transition-delay: 120ms; }
    .rp-lightbox-close:hover { color: var(--rp-oranye); }
    @media (min-width: 640px) {
      .rp-hero-actions { flex-direction: row; }
    }
    @media (min-width: 768px) {
      .rp-hero-title { font-size: 3rem; font-weight: 900; }
      .rp-hero-date { font-size: 1rem; }
      .rp-btn { font-size: 1rem; }
      .rp-about-card { flex-direction: row; padding: 48px; }
      .rp-gallery-arrow { display: flex; align-items: center; justify-content: center; }
      .rp-gallery-track { gap: 24px; }
      .rp-gallery-item { width: 60%; height: 320px; }
      .rp-gallery-hint { display: none; }
      .rp-home-cards { grid-template-columns: repeat(2, 1fr); }
      .rp-cta-card { flex-direction: row; padding: 48px; gap: 16px; }
      .rp-cta-text { text-align: left; }
      .rp-cta-text p { margin-left: 0; margin-right: 0; }
      .rp-cta-mascot { width: 288px; margin-top: 0; }
      .rp-lightbox { padding: 40px; }
      .rp-lightbox-box { aspect-ratio: auto; height: 85vh; }
      .rp-lightbox-close { top: 40px; right: 40px; }
    }
    @media (min-width: 1024px) {
      .rp-gallery-item { width: 45%; }
      .rp-home-cards { grid-template-columns: repeat(4, 1fr); }
      .rp-cta-card { padding: 64px; }
    }
  `],
})
export class RapimnasIndexPage implements OnInit, OnDestroy, RapimnasIndexView {
  private presenter = inject(RapimnasIndexPresenter);

  readonly path = rapimnasPath;
  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);
  selectedImage = signal<string | null>(null);
  lightboxOpen = signal(false);
  private closeTimeoutId?: ReturnType<typeof setTimeout>;

  @ViewChild('carousel') private carouselRef?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  ngOnDestroy(): void {
    if (this.closeTimeoutId) clearTimeout(this.closeTimeoutId);
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }

  scrollGallery(direction: 'left' | 'right'): void {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    const amount = window.innerWidth > 768 ? 600 : 300;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  openLightbox(url: string): void {
    if (this.closeTimeoutId) { clearTimeout(this.closeTimeoutId); this.closeTimeoutId = undefined; }
    this.selectedImage.set(url);
    requestAnimationFrame(() => requestAnimationFrame(() => this.lightboxOpen.set(true)));
  }

  /** Keep the lightbox mounted through its zoom-out transition before clearing the image. */
  closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.closeTimeoutId = setTimeout(() => { this.selectedImage.set(null); this.closeTimeoutId = undefined; }, 320);
  }
}
