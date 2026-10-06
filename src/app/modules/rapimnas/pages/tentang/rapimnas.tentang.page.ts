import { Component, OnInit, inject, signal } from '@angular/core';
import { RapimnasPublic } from '../../entities/rapimnas';
import { RapimnasTentangPresenter } from './rapimnas.tentang.presenter';
import { RapimnasTentangView } from './rapimnas.tentang.view';

@Component({
  selector: 'app-rapimnas-tentang-page',
  standalone: true,
  templateUrl: './rapimnas.tentang.page.html',
  providers: [RapimnasTentangPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-tentang { max-width: 960px; margin: 0 auto; padding: 40px 16px 80px; }
    .rp-tentang-head { text-align: center; margin-bottom: 64px; }
    .rp-tentang-badge { display: inline-block; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.72rem; font-weight: 700; padding: 8px 20px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 24px; }
    .rp-tentang-head h1 { color: var(--rp-krem); font-size: 2rem; font-weight: 800; margin: 0 0 16px; }
    .rp-tentang-theme-card { background: color-mix(in srgb, var(--rp-merah) 60%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); padding: 24px; border-radius: 16px; max-width: 640px; margin: 0 auto; }
    .rp-tentang-theme-card h2 { color: var(--rp-oranye); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px; }
    .rp-tentang-theme-card p { color: var(--rp-krem); font-style: italic; font-size: 1.05rem; margin: 0; }
    .rp-tentang-desc { background: color-mix(in srgb, var(--rp-merah) 40%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 32px; padding: 32px; margin-bottom: 64px; }
    .rp-tentang-desc p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); line-height: 1.8; margin: 0 0 16px; }
    .rp-tentang-vm { display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 80px; }
    .rp-tentang-visi { background: linear-gradient(135deg, color-mix(in srgb, var(--rp-merah) 80%, transparent), var(--rp-maroon)); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); border-radius: 32px; padding: 32px; }
    .rp-tentang-visi h3 { color: var(--rp-kuning); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px; }
    .rp-tentang-visi p { color: var(--rp-krem); font-style: italic; font-size: 1.1rem; line-height: 1.6; margin: 0; }
    .rp-tentang-misi { background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); border-radius: 32px; padding: 32px; }
    .rp-tentang-misi h3 { color: var(--rp-kuning); margin: 0 0 24px; }
    .rp-misi-item { display: flex; gap: 16px; padding: 12px; }
    .rp-misi-num { width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: color-mix(in srgb, var(--rp-merah) 50%, transparent); color: var(--rp-oranye); display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .rp-misi-item p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.9rem; line-height: 1.6; margin: 0; }
    .rp-tentang-cols { display: grid; grid-template-columns: 1fr; gap: 48px; }
    .rp-tentang-cols h2 { color: var(--rp-krem); font-size: 1.5rem; margin: 0 0 24px; }
    .rp-tujuan-item { display: flex; gap: 16px; padding: 16px; margin-bottom: 8px; }
    .rp-tujuan-item .rp-tujuan-icon { color: var(--rp-oranye); flex-shrink: 0; }
    .rp-tujuan-item p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.9rem; line-height: 1.6; margin: 0; }
    .rp-kegiatan-item { display: flex; align-items: center; gap: 20px; background: color-mix(in srgb, var(--rp-merah) 30%, transparent); padding: 16px; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--rp-merah) 30%, transparent); margin-bottom: 12px; }
    .rp-kegiatan-num { width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px; background: var(--rp-merah); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .rp-kegiatan-item span { color: var(--rp-krem); font-weight: 500; font-size: 0.9rem; }
    @media (min-width: 1024px) {
      .rp-tentang-vm { grid-template-columns: 5fr 7fr; align-items: center; }
      .rp-tentang-cols { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class RapimnasTentangPage implements OnInit, RapimnasTentangView {
  private presenter = inject(RapimnasTentangPresenter);

  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
}
