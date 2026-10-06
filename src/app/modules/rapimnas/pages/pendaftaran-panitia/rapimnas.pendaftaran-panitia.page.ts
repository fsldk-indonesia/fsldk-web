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
    .rp-panitia { max-width: 768px; margin: 0 auto; padding: 104px 16px 64px; }
    .rp-panitia-card { background: rgba(26, 35, 64, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .rp-panitia-head { text-align: center; margin-bottom: 32px; }
    .rp-panitia-head h2 { color: #fff; font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin: 0 0 8px; }
    .rp-panitia-head p { color: #cbd5e1; margin: 0; }
    .rp-panitia-form { display: flex; flex-direction: column; gap: 24px; }
    .rp-field { margin: 0; }
    .rp-field-row { display: grid; grid-template-columns: 1fr; gap: 24px; }
    .rp-field label { display: block; color: #cbd5e1; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; margin-bottom: 8px; }
    .rp-field input, .rp-field select, .rp-field textarea {
      width: 100%; padding: 12px 16px; border-radius: 12px; background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-size: 0.9rem; font-family: inherit;
    }
    .rp-field input::placeholder, .rp-field textarea::placeholder { color: #94a3b8; }
    .rp-field input:focus, .rp-field select:focus, .rp-field textarea:focus { outline: none; box-shadow: 0 0 0 2px #ef4444; }
    .rp-field select { cursor: pointer; }
    .rp-field select option { background: #1a2340; }
    .rp-field textarea { resize: none; }
    .rp-panitia-submit {
      width: 100%; padding: 16px 0; border-radius: 12px; border: none; background: #dc2626; color: #fff;
      font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px;
      box-shadow: 0 10px 15px -3px rgba(127, 29, 29, 0.5), 0 4px 6px -4px rgba(127, 29, 29, 0.5);
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .rp-panitia-submit:hover { background: #b91c1c; }
    .rp-panitia-notice { margin-top: 20px; padding: 16px; border-radius: 12px; background: color-mix(in srgb, var(--rp-oranye) 15%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.88rem; text-align: center; }
    .rp-panitia-closed { text-align: center; padding: 48px 32px; background: rgba(26, 35, 64, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .rp-panitia-closed h2 { color: #fff; font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin: 0 0 12px; }
    .rp-panitia-closed p { color: #cbd5e1; margin: 0; }
    @media (min-width: 768px) {
      .rp-panitia-card { padding: 40px; }
      .rp-field-row { grid-template-columns: 1fr 1fr; }
    }
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
