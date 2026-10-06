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
            <div class="rp-footer-contacts">
              <a [href]="'mailto:' + d.footerContactEmail" class="rp-footer-contact-link">
                <svg class="rp-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                {{ d.footerContactEmail }}
              </a>
              @if (footerWaContacts().length) {
                <div class="rp-footer-contact-phone">
                  <svg class="rp-footer-icon rp-footer-icon-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <div class="rp-footer-contact-phone-list">
                    @for (c of footerWaContacts(); track $index) {
                      <a [href]="'https://wa.me/' + c.phoneNumber" target="_blank" rel="noopener noreferrer" class="rp-footer-contact-link">{{ c.name }} — {{ c.phoneNumber }}</a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <div class="rp-footer-col rp-footer-col-right">
          <p class="rp-footer-label">Ikuti Info Terbaru:</p>
          @if (data(); as d) {
            <div class="rp-footer-social">
              <a [href]="d.footerIgUrl" target="_blank" rel="noopener noreferrer" class="rp-footer-chip">
                <svg class="rp-footer-chip-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
                {{ d.footerIgHandle }}
              </a>
              <a [href]="d.footerTiktokUrl" target="_blank" rel="noopener noreferrer" class="rp-footer-chip">
                <svg class="rp-footer-chip-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
                {{ d.footerTiktokHandle }}
              </a>
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
    .rp-footer-inner { max-width: 1152px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; gap: 40px; }
    .rp-footer-col { flex: 1; }
    .rp-footer-title { font-weight: 700; font-size: 1.125rem; line-height: 1.75rem; color: #fff; margin: 0; }
    .rp-footer-sub { font-size: 0.875rem; line-height: 1.25rem; color: color-mix(in srgb, var(--rp-krem) 80%, transparent); margin: 4px 0 0; }
    .rp-footer-label { color: var(--rp-oranye); font-weight: 600; font-size: 0.875rem; line-height: 1.25rem; margin: 0 0 8px; }

    .rp-footer-col-center { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    .rp-footer-contacts { display: flex; flex-direction: column; gap: 8px; font-size: 0.875rem; line-height: 1.25rem; color: color-mix(in srgb, var(--rp-krem) 90%, transparent); }
    .rp-footer-contact-link { text-decoration: none; color: inherit; transition: color .15s ease; }
    .rp-footer-contact-link:hover { color: var(--rp-oranye); }
    .rp-footer-contacts > .rp-footer-contact-link { display: flex; align-items: center; gap: 8px; }
    .rp-footer-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .rp-footer-contact-phone { display: flex; align-items: flex-start; gap: 8px; }
    .rp-footer-icon-phone { margin-top: 2px; }
    .rp-footer-contact-phone-list { display: flex; flex-direction: column; }
    .rp-footer-contact-phone-list a + a { margin-top: 4px; }

    .rp-footer-col-right { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    .rp-footer-social { display: flex; flex-direction: column; gap: 12px; }
    .rp-footer-chip { display: inline-flex; align-items: center; gap: 8px; font-size: 0.875rem; line-height: 1.25rem; background: color-mix(in srgb, var(--rp-merah) 20%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); border-radius: 8px; padding: 8px 16px; color: var(--rp-krem); text-decoration: none; transition: color .15s ease, border-color .15s ease; }
    .rp-footer-chip:hover { color: var(--rp-oranye); border-color: var(--rp-oranye); }
    .rp-footer-chip-icon { width: 20px; height: 20px; transition: transform .15s ease; }
    .rp-footer-chip:hover .rp-footer-chip-icon { transform: scale(1.1); }

    .rp-footer-copyright { max-width: 1152px; margin: 40px auto 0; padding: 24px 16px 0; border-top: 1px solid var(--rp-merah); text-align: center; font-size: 0.75rem; line-height: 1rem; color: color-mix(in srgb, var(--rp-krem) 60%, transparent); }
    @media (min-width: 640px) {
      .rp-footer-social { flex-direction: row; }
    }
    @media (min-width: 768px) {
      .rp-footer-inner { flex-direction: row; justify-content: space-between; align-items: center; gap: 24px; }
      .rp-footer-col-center { align-items: center; }
      .rp-footer-col-right { align-items: flex-end; }
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
