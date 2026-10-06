import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RapimnasRepository } from '../repositories/rapimnas.repository';
import { RapimnasPublic, RapimnasContact } from '../entities/rapimnas';

@Component({
  selector: 'app-rapimnas-footer',
  standalone: true,
  template: `
    <footer class="rp-footer">
      <div class="rp-footer-inner">
        <div class="rp-footer-col">
          <h3 class="rp-footer-title">RAPIMNAS FSLDK 2026</h3>
          <p class="rp-footer-sub">Diselenggarakan di Universitas Diponegoro, Semarang</p>
        </div>

        <div class="rp-footer-col rp-footer-col-center">
          <p class="rp-footer-label">Hubungi Kami:</p>
          @if (data(); as d) {
            <a [href]="'mailto:' + d.footerContactEmail" class="rp-footer-link">{{ d.footerContactEmail }}</a>
            @for (c of footerWaContacts(); track $index) {
              <a [href]="'https://wa.me/' + c.phoneNumber" target="_blank" rel="noopener noreferrer" class="rp-footer-link">{{ c.name }} — {{ c.phoneNumber }}</a>
            }
          }
        </div>

        <div class="rp-footer-col rp-footer-col-right">
          <p class="rp-footer-label">Ikuti Info Terbaru:</p>
          @if (data(); as d) {
            <div class="rp-footer-social">
              <a [href]="d.footerIgUrl" target="_blank" rel="noopener noreferrer" class="rp-footer-chip">{{ d.footerIgHandle }}</a>
              <a [href]="d.footerTiktokUrl" target="_blank" rel="noopener noreferrer" class="rp-footer-chip">{{ d.footerTiktokHandle }}</a>
            </div>
          }
        </div>
      </div>

      <div class="rp-footer-copyright">
        @if (data(); as d) { {{ d.footerCopyrightText }} }
      </div>
    </footer>
  `,
  styles: [`
    .rp-footer { background: var(--rp-maroon); color: var(--rp-krem); border-top: 1px solid var(--rp-merah); padding: 40px 0 24px; margin-top: 80px; }
    .rp-footer-inner { max-width: 1152px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; gap: 40px; }
    .rp-footer-col { flex: 1; }
    .rp-footer-title { font-weight: 700; font-size: 1.1rem; color: #fff; margin: 0; }
    .rp-footer-sub { font-size: 0.9rem; opacity: 0.8; margin: 4px 0 0; }
    .rp-footer-label { color: var(--rp-oranye); font-weight: 600; font-size: 0.9rem; margin: 0 0 8px; }
    .rp-footer-link { display: block; color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.9rem; text-decoration: none; margin-bottom: 8px; }
    .rp-footer-link:hover { color: var(--rp-oranye); }
    .rp-footer-social { display: flex; flex-direction: column; gap: 10px; }
    .rp-footer-chip { display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; background: color-mix(in srgb, var(--rp-merah) 20%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); border-radius: 8px; padding: 8px 16px; color: var(--rp-krem); text-decoration: none; }
    .rp-footer-chip:hover { color: var(--rp-oranye); }
    .rp-footer-copyright { max-width: 1152px; margin: 40px auto 0; padding: 24px 16px 0; border-top: 1px solid var(--rp-merah); text-align: center; font-size: 0.78rem; opacity: 0.6; }
    @media (min-width: 768px) {
      .rp-footer-inner { flex-direction: row; justify-content: space-between; align-items: center; }
      .rp-footer-col-center { align-items: center; display: flex; flex-direction: column; }
      .rp-footer-col-right { align-items: flex-end; display: flex; flex-direction: column; }
    }
  `],
})
export class RapimnasFooterComponent implements OnInit {
  private repo = inject(RapimnasRepository);

  data = signal<RapimnasPublic | null>(null);
  footerWaContacts = computed<RapimnasContact[]>(() =>
    (this.data()?.contacts ?? []).filter((c) => c.contactType === 'footer_wa').sort((a, b) => a.sortOrder - b.sortOrder),
  );

  ngOnInit(): void {
    this.repo.getPublic().subscribe({ next: (d) => this.data.set(d), error: () => {} });
  }
}
