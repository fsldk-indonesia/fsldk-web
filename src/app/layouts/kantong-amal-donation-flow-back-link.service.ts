import { Injectable, signal } from '@angular/core';

export interface DonationFlowBackLink {
  label: string;
  path: string;
}

const DEFAULT_BACK_LINK: DonationFlowBackLink = { label: 'Kembali ke Beranda', path: '/' };

/**
 * State "tombol kembali" KantongAmalDonationFlowLayoutComponent — di-provide
 * SCOPED di layout itu sendiri (lihat providers di komponennya), jadi
 * instance-nya fresh tiap kali shell ini dimasuki & otomatis dibuang saat
 * keluar, bukan singleton root yang bisa bocor state ke rute lain.
 *
 * Layout sendiri tidak tahu campaign/donasi mana yang sedang dilihat (ia
 * cuma shell yang dipakai bersama 3 halaman: donate/payment-status/
 * donation-receipt), jadi tiap halaman yang memanggil `set()` begitu slug/
 * campaignSlug-nya diketahui — donate tahu dari route param langsung,
 * payment-status & donation-receipt baru tahu setelah donasi ter-load
 * (field `campaignSlug`). Default sebelum di-set manapun tetap "Kembali ke
 * Beranda" (sama seperti sebelumnya) supaya tidak pernah kosong.
 */
@Injectable()
export class KantongAmalDonationFlowBackLinkService {
  readonly link = signal<DonationFlowBackLink>(DEFAULT_BACK_LINK);

  set(label: string, path: string): void {
    this.link.set({ label, path });
  }

  reset(): void {
    this.link.set(DEFAULT_BACK_LINK);
  }
}
