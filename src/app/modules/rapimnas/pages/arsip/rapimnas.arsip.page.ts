import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/icon.component';
import { RapimnasPublic, RapimnasResource } from '../../entities/rapimnas';
import { RapimnasArsipPresenter } from './rapimnas.arsip.presenter';
import { RapimnasArsipView } from './rapimnas.arsip.view';

@Component({
  selector: 'app-rapimnas-arsip-page',
  standalone: true,
  templateUrl: './rapimnas.arsip.page.html',
  imports: [IconComponent],
  providers: [RapimnasArsipPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-arsip { padding: 40px 0 80px; }
    .rp-arsip-head { max-width: 896px; margin: 0 auto 64px; padding: 0 16px; text-align: center; position: relative; }
    .rp-arsip-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 256px; height: 256px; background: color-mix(in srgb, var(--rp-oranye) 20%, transparent); border-radius: 50%; filter: blur(80px); pointer-events: none; }
    .rp-arsip-badge { position: relative; z-index: 10; display: inline-block; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.75rem; font-weight: 600; padding: 8px 20px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; box-shadow: 0 0 15px rgba(254, 112, 2, 0.3); }
    .rp-arsip-head h1 { position: relative; z-index: 10; color: var(--rp-krem); font-size: 2.25rem; font-weight: 800; margin: 0 0 16px; }
    .rp-arsip-title-accent { background: linear-gradient(to right, var(--rp-oranye), var(--rp-kuning)); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .rp-arsip-head p { position: relative; z-index: 10; color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-style: italic; margin: 0; }
    .rp-arsip-list { max-width: 896px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 10; }
    .rp-arsip-item { display: flex; flex-direction: column; align-items: flex-start; gap: 20px; background: color-mix(in srgb, var(--rp-maroon) 30%, transparent); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 16px; padding: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-arsip-item:hover { border-color: color-mix(in srgb, var(--rp-oranye) 50%, transparent); transform: translateY(-4px); box-shadow: 0 10px 25px -10px rgba(254, 112, 2, 0.3); }
    .rp-arsip-icon { width: 56px; height: 56px; flex-shrink: 0; background: var(--rp-bg); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--rp-oranye); box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-arsip-item:hover .rp-arsip-icon { transform: scale(1.1); }
    .rp-arsip-item:nth-child(even) .rp-arsip-icon { color: var(--rp-merah); }
    .rp-arsip-body { flex: 1; width: 100%; }
    .rp-arsip-body h2 { color: var(--rp-krem); font-size: 1.125rem; font-weight: 700; margin: 0 0 4px; transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-arsip-item:hover .rp-arsip-body h2 { color: var(--rp-kuning); }
    .rp-arsip-body p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-size: 0.875rem; line-height: 1.625; margin: 0; }
    .rp-arsip-btn { display: inline-flex; justify-content: center; align-items: center; gap: 8px; width: 100%; margin-top: 8px; padding: 12px 24px; background: var(--rp-bg); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); color: var(--rp-krem); font-weight: 700; border-radius: 12px; text-decoration: none; transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-arsip-btn:hover { background: var(--rp-oranye); border-color: var(--rp-oranye); color: var(--rp-bg); }
    .rp-arsip-btn-icon { display: inline-flex; transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-arsip-btn:hover .rp-arsip-btn-icon { transform: translateY(4px); }
    @media (min-width: 768px) {
      .rp-arsip-item { flex-direction: row; align-items: center; }
      .rp-arsip-head h1 { font-size: 3rem; }
      .rp-arsip-body h2 { font-size: 1.25rem; }
      .rp-arsip-btn { width: auto; margin-top: 0; }
    }
  `],
})
export class RapimnasArsipPage implements OnInit, RapimnasArsipView {
  private presenter = inject(RapimnasArsipPresenter);

  data = signal<RapimnasPublic | null>(null);
  loading = signal(true);
  visibleResources = computed<RapimnasResource[]>(() => this.data()?.resources ?? []);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setData(data: RapimnasPublic): void { this.data.set(data); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
}
