import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-rapimnas-back-to-top',
  standalone: true,
  template: `
    <div class="rp-btt" [class.visible]="visible()">
      <button type="button" class="rp-btt-btn" (click)="scrollToTop()" aria-label="Kembali ke atas">
        <span class="rp-btt-tooltip">Kembali ke Atas &uarr;</span>
        <span class="rp-btt-circle">
          <img src="assets/rapimnas/maskot-static.png" alt="Back to top" class="rp-btt-img">
        </span>
      </button>
    </div>
  `,
  styles: [`
    .rp-btt { position: fixed; bottom: 32px; right: 32px; z-index: 60; opacity: 0; transform: translateY(80px); pointer-events: none; transition: opacity .5s cubic-bezier(0.4, 0, 0.2, 1), transform .5s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-btt.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .rp-btt-btn { position: relative; display: flex; flex-direction: column; align-items: center; background: none; border: none; cursor: pointer; padding: 0; }
    .rp-btt-btn:focus { outline: none; }
    .rp-btt-tooltip { position: absolute; top: -48px; background: var(--rp-maroon); color: var(--rp-kuning); font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 8px; white-space: nowrap; border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); opacity: 0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); transition: opacity .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-btt-btn:hover .rp-btt-tooltip { opacity: 1; }
    .rp-btt-circle { width: 64px; height: 64px; border-radius: 50%; background: color-mix(in srgb, var(--rp-merah) 20%, transparent); backdrop-filter: blur(12px); border: 2px solid color-mix(in srgb, var(--rp-oranye) 50%, transparent); padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 0 15px rgba(254,112,2,0.3); transition: all .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-btt-btn:hover .rp-btt-circle { transform: translateY(-8px); box-shadow: 0 0 25px rgba(252,224,67,0.6); }
    .rp-btt-img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06)); transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-btt-btn:hover .rp-btt-img { transform: scale(1.1); }
    @media (min-width: 768px) {
      .rp-btt-circle { width: 80px; height: 80px; }
    }
  `],
})
export class RapimnasBackToTopComponent {
  visible = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.visible.set(window.scrollY > 300);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
