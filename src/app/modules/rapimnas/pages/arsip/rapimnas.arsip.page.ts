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
    .rp-arsip-head { max-width: 640px; margin: 0 auto 64px; padding: 0 16px; text-align: center; }
    .rp-arsip-badge { display: inline-block; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); font-size: 0.72rem; font-weight: 700; padding: 8px 20px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 24px; }
    .rp-arsip-head h1 { color: var(--rp-krem); font-size: 2rem; font-weight: 800; margin: 0 0 16px; }
    .rp-arsip-head p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-style: italic; margin: 0; }
    .rp-arsip-list { max-width: 720px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; gap: 16px; }
    .rp-arsip-item { display: flex; flex-direction: column; gap: 16px; background: color-mix(in srgb, var(--rp-merah) 30%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 16px; padding: 24px; }
    .rp-arsip-icon { width: 56px; height: 56px; flex-shrink: 0; background: var(--rp-bg); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--rp-oranye); }
    .rp-arsip-body { flex: 1; }
    .rp-arsip-body h2 { color: var(--rp-krem); font-size: 1.1rem; margin: 0 0 4px; }
    .rp-arsip-body p { color: color-mix(in srgb, var(--rp-krem) 80%, transparent); font-size: 0.9rem; margin: 0; }
    .rp-arsip-btn { display: inline-flex; justify-content: center; align-items: center; gap: 8px; padding: 12px 24px; background: var(--rp-bg); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); color: var(--rp-krem); font-weight: 700; border-radius: 12px; text-decoration: none; }
    .rp-arsip-btn:hover { background: var(--rp-oranye); color: var(--rp-bg); }
    @media (min-width: 768px) {
      .rp-arsip-item { flex-direction: row; align-items: center; }
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
