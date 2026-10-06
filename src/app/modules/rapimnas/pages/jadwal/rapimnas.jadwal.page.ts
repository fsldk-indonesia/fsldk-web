import { Component, OnInit, inject, signal } from '@angular/core';
import { RapimnasRundownComponent } from '../../components/rapimnas-rundown.component';
import { RapimnasPublic } from '../../entities/rapimnas';
import { RapimnasJadwalPresenter } from './rapimnas.jadwal.presenter';
import { RapimnasJadwalView } from './rapimnas.jadwal.view';

@Component({
  selector: 'app-rapimnas-jadwal-page',
  standalone: true,
  templateUrl: './rapimnas.jadwal.page.html',
  imports: [RapimnasRundownComponent],
  providers: [RapimnasJadwalPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-jadwal { padding: 40px 0 80px; }
    .rp-jadwal-head { max-width: 640px; margin: 0 auto 64px; padding: 0 16px; text-align: center; }
    .rp-jadwal-badge { display: inline-block; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.72rem; font-weight: 700; padding: 8px 20px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 24px; }
    .rp-jadwal-head h1 { color: var(--rp-krem); font-size: 2rem; font-weight: 800; margin: 0 0 16px; }
    .rp-jadwal-head p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-style: italic; margin: 0; }
  `],
})
export class RapimnasJadwalPage implements OnInit, RapimnasJadwalView {
  private presenter = inject(RapimnasJadwalPresenter);

  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
}
