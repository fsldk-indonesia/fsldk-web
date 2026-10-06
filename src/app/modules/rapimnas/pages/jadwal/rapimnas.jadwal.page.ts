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
    .rp-jadwal-head { max-width: 896px; margin: 0 auto 64px; padding: 0 16px; text-align: center; position: relative; }
    .rp-jadwal-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 256px; height: 256px; background: color-mix(in srgb, var(--rp-oranye) 20%, transparent); border-radius: 50%; filter: blur(80px); pointer-events: none; }
    .rp-jadwal-badge { position: relative; z-index: 10; display: inline-block; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.75rem; font-weight: 600; padding: 8px 20px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; box-shadow: 0 0 15px rgba(254, 112, 2, 0.3); }
    .rp-jadwal-head h1 { position: relative; z-index: 10; color: var(--rp-krem); font-size: 2.25rem; line-height: 2.5rem; font-weight: 800; margin: 0 0 16px; }
    .rp-jadwal-title-accent { background: linear-gradient(to right, var(--rp-oranye), var(--rp-kuning)); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .rp-jadwal-head p { position: relative; z-index: 10; color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-style: italic; margin: 0; }
    .rp-jadwal-rundown { position: relative; z-index: 10; padding-bottom: 80px; }
    @media (min-width: 768px) {
      .rp-jadwal-head h1 { font-size: 3rem; line-height: 1; }
    }
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
