import { Component, OnInit, inject, signal } from '@angular/core';
import { SettingApiService } from '../modules/setting/services/setting-api.service';
import { IconComponent } from './icon.component';

/**
 * Floating action button WhatsApp, dipasang global di PublicLayoutComponent
 * (tampil di semua halaman publik) — style FAB (fixed, bawah-kanan, bundar,
 * shadow, hover naik) meniru .back-to-top milik ldksyahid-app
 * (public/landing-page-ext-rsrc/css/style-v1.0.6.css), tapi cuma satu tombol
 * (bukan sepasang back-to-top + whatsapp) dan warnanya brand WhatsApp, bukan
 * primary hijau FSLDK — supaya tetap kebaca sebagai "chat WhatsApp", bukan
 * aksi generik situs.
 *
 * Nomornya via App Setting (GroupKontak/KeyContactWhatsapp — sama pola
 * dengan contact_email di home.index.page.ts), bukan hardcode, supaya bisa
 * diubah tanpa deploy. Tombol disembunyikan total sampai nomornya berhasil
 * di-fetch (bukan fallback ke nomor hardcode) — menghindari link mati kalau
 * request gagal/setting belum diisi.
 */
@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (waLink()) {
      <a [href]="waLink()" target="_blank" rel="noopener" class="whatsapp-fab" aria-label="Chat via WhatsApp">
        <app-icon name="whatsapp" [size]="28" />
      </a>
    }
  `,
  styles: [`
    .whatsapp-fab {
      position: fixed; right: 30px; bottom: 30px; z-index: 40;
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #25d366; color: #fff; box-shadow: 0 8px 24px rgba(37, 211, 102, .45);
      transition: transform var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .whatsapp-fab:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(37, 211, 102, .55); text-decoration: none; }
    @media (prefers-reduced-motion: reduce) { .whatsapp-fab { transition: none; } }
    @media (max-width: 640px) { .whatsapp-fab { right: 18px; bottom: 18px; width: 50px; height: 50px; } }
  `],
})
export class WhatsappFabComponent implements OnInit {
  private settingApi = inject(SettingApiService);

  waLink = signal<string | null>(null);

  ngOnInit(): void {
    this.settingApi.getPublicContactWhatsapp().subscribe({
      next: (res) => {
        const digits = res.whatsappNumber?.replace(/\D/g, '');
        if (digits) this.waLink.set(`https://wa.me/${digits}`);
      },
      error: () => {},
    });
  }
}
