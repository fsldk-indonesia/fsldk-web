import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * Satu motion signature yang dipakai konsisten di seluruh halaman publik
 * Rapimnas: heading section (dan elemen lain yang dipasangi directive ini)
 * "masuk" — fade + naik 24px — begitu scroll mencapainya, memakai
 * IntersectionObserver (tanpa dependency baru). Setiap komponen yang
 * memasang `rpReveal` WAJIB mendefinisikan sendiri CSS-nya:
 *
 *   .rp-reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s cubic-bezier(0.16,1,0.3,1), transform .7s cubic-bezier(0.16,1,0.3,1); }
 *   .rp-reveal.rp-revealed { opacity: 1; transform: none; }
 *
 * (disengaja tidak lewat stylesheet bersama — konvensi codebase ini: CSS
 * tetap hand-written per-komponen lewat `styles:` array, bukan class global).
 * Sekali terlihat, class `rp-revealed` menempel permanen (tidak di-toggle
 * ulang saat scroll keluar) — motion ini menandai "baru muncul", bukan
 * efek berulang setiap kali elemen keluar-masuk viewport.
 */
@Directive({
  selector: '[rpReveal]',
  standalone: true,
  host: { class: 'rp-reveal' },
})
export class RapimnasRevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('rp-revealed');
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
