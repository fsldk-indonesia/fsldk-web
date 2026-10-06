import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { IconComponent } from '../../../../shared/icon.component';
import { RapimnasContact, RapimnasPickupLocation, RapimnasPublic } from '../../entities/rapimnas';
import { RapimnasPendaftaranPesertaPresenter } from './rapimnas.pendaftaran-peserta.presenter';
import { RapimnasPendaftaranPesertaView } from './rapimnas.pendaftaran-peserta.view';

const PICKUP_EMOJI: Record<string, string> = {
  'Stasiun Kereta': '🚆',
  Bandara: '✈️',
  'Terminal Bus': '🚌',
};

@Component({
  selector: 'app-rapimnas-pendaftaran-peserta-page',
  standalone: true,
  templateUrl: './rapimnas.pendaftaran-peserta.page.html',
  imports: [IconComponent],
  providers: [RapimnasPendaftaranPesertaPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-peserta { max-width: 960px; margin: 0 auto; padding: 40px 16px 80px; }
    .rp-peserta-head { max-width: 640px; margin: 0 auto 64px; text-align: center; }
    .rp-peserta-badge { display: inline-block; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.72rem; font-weight: 700; padding: 8px 20px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 24px; }
    .rp-peserta-head h1 { color: var(--rp-krem); font-size: 2rem; font-weight: 800; margin: 0 0 16px; }
    .rp-peserta-head p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-style: italic; margin: 0; }
    .rp-peserta-card { background: color-mix(in srgb, var(--rp-maroon) 40%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 32px; padding: 32px; display: grid; grid-template-columns: 1fr; gap: 40px; }
    .rp-peserta-col { display: flex; flex-direction: column; gap: 32px; }
    .rp-peserta-col-aksi { justify-content: center; }
    .rp-peserta-block h3 { color: var(--rp-kuning); font-size: 1.25rem; margin: 0 0 16px; }
    .rp-timeline-row { display: flex; justify-content: space-between; align-items: center; background: color-mix(in srgb, var(--rp-merah) 20%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); padding: 16px; border-radius: 12px; margin-bottom: 12px; }
    .rp-timeline-row:last-child { margin-bottom: 0; }
    .rp-timeline-row strong { color: var(--rp-krem); }
    .rp-timeline-row span { color: color-mix(in srgb, var(--rp-krem) 70%, transparent); font-size: 0.85rem; }
    .rp-harga-box { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); padding: 20px; border-radius: 12px; }
    .rp-harga-group { margin-bottom: 20px; }
    .rp-harga-group:last-of-type { margin-bottom: 0; }
    .rp-harga-group-label { display: block; color: var(--rp-oranye); font-weight: 700; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.025em; margin-bottom: 8px; }
    .rp-harga-item { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,.1); padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; }
    .rp-harga-item:last-child { margin-bottom: 0; }
    .rp-harga-item span:first-child { color: var(--rp-krem); font-size: 0.875rem; }
    .rp-harga-item span:last-child { color: var(--rp-kuning); font-weight: 700; }
    .rp-rekening { padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); }
    .rp-rekening small { display: block; color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-size: 0.75rem; margin-bottom: 4px; }
    .rp-rekening strong { display: block; color: var(--rp-krem); font-weight: 600; font-size: 0.875rem; }
    .rp-rekening em { color: var(--rp-oranye); font-size: 0.75rem; }
    .rp-aksi-box { background: color-mix(in srgb, var(--rp-bg) 50%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 30%, transparent); border-radius: 16px; padding: 24px; text-align: center; }
    .rp-aksi-box h3 { color: var(--rp-krem); font-size: 1.125rem; margin: 0 0 8px; }
    .rp-aksi-box p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-size: 0.875rem; margin: 0 0 24px; }
    .rp-aksi-links { display: flex; flex-direction: column; gap: 16px; }
    .rp-btn-secondary { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; border-radius: 12px; background: var(--rp-merah); color: var(--rp-krem); font-weight: 500; text-decoration: none; border: 1px solid color-mix(in srgb, var(--rp-krem) 30%, transparent); box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1); transition: background-color .3s ease; }
    .rp-btn-secondary:hover { background: color-mix(in srgb, var(--rp-merah) 80%, transparent); }
    .rp-btn-primary-full { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; border-radius: 12px; background: var(--rp-oranye); color: var(--rp-maroon); font-weight: 700; text-decoration: none; box-shadow: 0 5px 15px rgba(254,112,2,0.4); transition: background-color .3s ease, box-shadow .3s ease, transform .3s ease; }
    .rp-btn-primary-full:hover { background: var(--rp-kuning); box-shadow: 0 5px 25px rgba(252,224,67,0.6); transform: translateY(-4px); }
    .rp-cp-box { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); padding: 20px; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); }
    .rp-cp-box h4 { color: var(--rp-kuning); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
    .rp-cp-contact { display: flex; align-items: center; gap: 12px; color: var(--rp-krem); text-decoration: none; margin-bottom: 12px; transition: color .2s ease; }
    .rp-cp-contact:last-child { margin-bottom: 0; }
    .rp-cp-contact:hover { color: var(--rp-oranye); }
    .rp-cp-contact:hover .rp-cp-avatar { transform: scale(1.1); }
    .rp-cp-avatar { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: var(--rp-maroon); display: flex; align-items: center; justify-content: center; color: var(--rp-krem); transition: transform .2s ease; }
    .rp-cp-info strong { display: block; font-size: 0.875rem; font-weight: 600; }
    .rp-cp-info span { font-size: 0.75rem; opacity: 0.7; }
    .rp-pickup-section { margin-top: 64px; background: color-mix(in srgb, var(--rp-maroon) 40%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 32px; padding: 32px; }
    .rp-pickup-section h2 { color: var(--rp-krem); font-size: 1.5rem; font-weight: 700; margin: 0 0 16px; }
    .rp-pickup-section p.rp-pickup-sub { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-size: 0.875rem; margin: 0 0 24px; }
    .rp-pickup-map { width: 100%; height: 288px; border-radius: 16px; overflow: hidden; border: 2px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); }
    .rp-pickup-map iframe { width: 100%; height: 100%; border: 0; }
    .rp-pickup-tags { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
    .rp-pickup-tag { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); color: var(--rp-oranye); font-size: 0.75rem; font-weight: 600; padding: 8px 16px; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,.05); transition: all .3s ease; }
    .rp-pickup-tag:hover { background: var(--rp-oranye); color: var(--rp-bg); border-color: var(--rp-oranye); transform: translateY(-4px); }
    @media (min-width: 768px) {
      .rp-peserta-card { grid-template-columns: 1fr 1fr; }
      .rp-pickup-map { height: 384px; }
    }
  `],
})
export class RapimnasPendaftaranPesertaPage implements OnInit, RapimnasPendaftaranPesertaView {
  private presenter = inject(RapimnasPendaftaranPesertaPresenter);
  private sanitizer = inject(DomSanitizer);

  readonly formatRupiah = formatRupiah;
  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);

  pesertaCpContacts = computed<RapimnasContact[]>(() =>
    (this.data()?.contacts ?? []).filter((c) => c.contactType === 'peserta_cp').sort((a, b) => a.sortOrder - b.sortOrder),
  );
  pickupLocations = computed<RapimnasPickupLocation[]>(() =>
    (this.data()?.pickupLocations ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
  );

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }

  safeMapUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /** "0895-3842-52700" -> "https://wa.me/62895384252700" (strip separators, 0-prefix -> 62). */
  waLink(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    return `https://wa.me/${normalized}`;
  }

  pickupEmoji(type: string): string {
    return PICKUP_EMOJI[type] ?? '📍';
  }
}
