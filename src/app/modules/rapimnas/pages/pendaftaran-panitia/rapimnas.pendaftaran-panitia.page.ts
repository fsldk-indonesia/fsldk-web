import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RapimnasPublic } from '../../entities/rapimnas';
import { RapimnasPendaftaranPanitiaPresenter } from './rapimnas.pendaftaran-panitia.presenter';
import { RapimnasPendaftaranPanitiaView } from './rapimnas.pendaftaran-panitia.view';

const DIVISI_OPTIONS = ['Acara', 'Media & Informasi', 'Humas & Sponsorship', 'Perlengkapan', 'Konsumsi'];

@Component({
  selector: 'app-rapimnas-pendaftaran-panitia-page',
  standalone: true,
  templateUrl: './rapimnas.pendaftaran-panitia.page.html',
  imports: [FormsModule],
  providers: [RapimnasPendaftaranPanitiaPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-panitia { max-width: 720px; margin: 0 auto; padding: 40px 16px 80px; }
    .rp-panitia-card { background: color-mix(in srgb, var(--rp-merah) 40%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 24px; padding: 32px; }
    .rp-panitia-head { text-align: center; margin-bottom: 32px; }
    .rp-panitia-head h2 { color: var(--rp-krem); font-size: 1.5rem; margin: 0 0 8px; }
    .rp-panitia-head p { color: color-mix(in srgb, var(--rp-krem) 70%, transparent); margin: 0; }
    .rp-field { margin-bottom: 20px; }
    .rp-field label { display: block; color: var(--rp-krem); font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }
    .rp-field input, .rp-field select, .rp-field textarea {
      width: 100%; padding: 12px 14px; border-radius: 12px; background: color-mix(in srgb, var(--rp-krem) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--rp-krem) 15%, transparent); color: var(--rp-krem); font-size: 0.9rem;
    }
    .rp-field textarea { resize: vertical; }
    .rp-panitia-submit { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--rp-oranye); color: var(--rp-maroon); font-weight: 700; cursor: pointer; }
    .rp-panitia-submit:hover { background: var(--rp-kuning); }
    .rp-panitia-notice { margin-top: 20px; padding: 16px; border-radius: 12px; background: color-mix(in srgb, var(--rp-oranye) 15%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.88rem; text-align: center; }
    .rp-panitia-closed { text-align: center; padding: 48px 32px; background: color-mix(in srgb, var(--rp-merah) 30%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 24px; color: var(--rp-krem); }
  `],
})
export class RapimnasPendaftaranPanitiaPage implements OnInit, RapimnasPendaftaranPanitiaView {
  private presenter = inject(RapimnasPendaftaranPanitiaPresenter);

  readonly divisiOptions = DIVISI_OPTIONS;
  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);
  submitted = signal(false);

  nama = '';
  email = '';
  nim = '';
  divisi = '';
  linkBerkas = '';
  alasan = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }

  /** Tidak ada panggilan HTTP — lihat catatan di atas task ini & spec
   *  decision #4: placeholder v1, tidak ada endpoint backend untuk ini. */
  onSubmit(): void {
    this.submitted.set(true);
  }
}
