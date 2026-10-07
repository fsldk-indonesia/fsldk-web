import { Component, OnInit, inject, signal } from '@angular/core';
import { RapimnasPublic } from '../../entities/rapimnas';
import { RapimnasRevealDirective } from '../../rapimnas-reveal.directive';
import { RapimnasTentangPresenter } from './rapimnas.tentang.presenter';
import { RapimnasTentangView } from './rapimnas.tentang.view';

@Component({
  selector: 'app-rapimnas-tentang-page',
  standalone: true,
  templateUrl: './rapimnas.tentang.page.html',
  imports: [RapimnasRevealDirective],
  providers: [RapimnasTentangPresenter],
  styles: [`
    .rp-page-loading { padding: 120px 0; text-align: center; color: var(--rp-krem); }
    .rp-reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(0.16,1,0.3,1), transform .8s cubic-bezier(0.16,1,0.3,1); }
    .rp-reveal.rp-revealed { opacity: 1; transform: none; }

    /* Outer page wrapper — min-h-screen bg-[#7d0526]/10 + pt-10 pb-20 overflow-hidden */
    .rp-tentang { background: color-mix(in srgb, var(--rp-maroon) 10%, var(--rp-bg)); padding: 40px 0 80px; overflow: hidden; }
    .rp-tentang-section { max-width: 1152px; margin: 0 auto; padding: 0 16px; } /* max-w-6xl mx-auto px-4 */

    /* Header — max-w-4xl mx-auto px-4 text-center mb-16 relative */
    .rp-tentang-head { max-width: 896px; margin: 0 auto 64px; padding: 0 16px; text-align: center; position: relative; }
    .rp-tentang-head-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 256px; height: 256px; background: color-mix(in srgb, var(--rp-oranye) 20%, transparent); border-radius: 999px; filter: blur(80px); pointer-events: none; z-index: 0; }
    .rp-tentang-badge { display: block; position: relative; z-index: 1; color: var(--rp-kuning); font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 20px; text-shadow: 0 0 20px rgba(254, 112, 2, 0.5); }
    .rp-tentang-h1 { position: relative; z-index: 1; color: var(--rp-krem); font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 16px; }
    .rp-tentang-h1-accent { color: var(--rp-oranye); }
    .rp-tentang-theme-card { position: relative; z-index: 1; background: color-mix(in srgb, var(--rp-maroon) 60%, transparent); backdrop-filter: blur(4px); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); padding: 24px; border-radius: 16px; max-width: 768px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); transition: box-shadow 0.5s; }
    .rp-tentang-theme-card:hover { box-shadow: 0 0 30px rgba(254, 112, 2, 0.15); }
    .rp-tentang-theme-card h2 { color: var(--rp-oranye); font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px; }
    .rp-tentang-theme-card p { color: var(--rp-krem); font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 500; font-size: 1rem; margin: 0; }

    /* Main description card */
    .rp-tentang-desc { position: relative; overflow: hidden; background: color-mix(in srgb, var(--rp-maroon) 40%, transparent); backdrop-filter: blur(24px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); border-radius: 40px; padding: 32px; margin-bottom: 64px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); transition: border-color 0.5s; }
    .rp-tentang-desc:hover { border-color: color-mix(in srgb, var(--rp-oranye) 50%, transparent); }
    .rp-tentang-desc-glow { position: absolute; width: 320px; height: 320px; border-radius: 999px; filter: blur(64px); transition: transform 3s; pointer-events: none; }
    .rp-tentang-desc-glow-1 { top: -128px; right: -128px; background: color-mix(in srgb, var(--rp-merah) 20%, transparent); }
    .rp-tentang-desc-glow-2 { bottom: -128px; left: -128px; background: color-mix(in srgb, var(--rp-oranye) 10%, transparent); }
    .rp-tentang-desc:hover .rp-tentang-desc-glow-1 { transform: rotate(180deg); }
    .rp-tentang-desc:hover .rp-tentang-desc-glow-2 { transform: rotate(-180deg); }
    .rp-tentang-desc p { position: relative; z-index: 1; max-width: 68ch; margin: 0 auto; color: color-mix(in srgb, var(--rp-krem) 90%, transparent); line-height: 1.7; font-size: 1.125rem; font-weight: 500; text-align: justify; }

    /* Section headings — shared "underline bar" motif */
    .rp-tentang-heading { position: relative; display: inline-block; color: var(--rp-krem); font-size: 1.875rem; font-weight: 700; margin: 0; }
    .rp-tentang-underline { position: absolute; bottom: -12px; left: 0; width: 64px; height: 6px; background: var(--rp-oranye); border-radius: 999px; }
    .rp-tentang-underline-center { left: 50%; transform: translateX(-50%); }

    /* Visi & Misi */
    .rp-tentang-vm-wrap { margin-bottom: 80px; }
    .rp-tentang-vm-head { text-align: center; margin-bottom: 40px; }
    .rp-tentang-vm { display: grid; grid-template-columns: 1fr; gap: 32px; }
    .rp-tentang-visi { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(135deg, color-mix(in srgb, var(--rp-merah) 80%, transparent), var(--rp-maroon)); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); border-radius: 32px; padding: 32px; box-shadow: 0 10px 30px rgba(183, 15, 60, 0.3); transition: transform 0.5s; }
    .rp-tentang-visi:hover { transform: translateY(-8px); }
    .rp-tentang-visi-glow { position: absolute; top: 0; right: 0; width: 128px; height: 128px; background: color-mix(in srgb, var(--rp-oranye) 20%, transparent); filter: blur(40px); border-radius: 999px; transition: transform 0.7s; }
    .rp-tentang-visi:hover .rp-tentang-visi-glow { transform: scale(1.5); }
    .rp-tentang-visi-inner { position: relative; z-index: 1; }
    .rp-tentang-visi-icon { width: 56px; height: 56px; background: var(--rp-oranye); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--rp-maroon); margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); }
    .rp-tentang-visi-icon svg { width: 32px; height: 32px; }
    .rp-tentang-visi h3 { color: var(--rp-kuning); font-size: 1.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; margin: 0 0 16px; }
    .rp-tentang-visi p { color: var(--rp-krem); font-style: italic; font-weight: 500; font-size: 1.125rem; line-height: 1.625; margin: 0; }
    .rp-tentang-misi { background: color-mix(in srgb, var(--rp-maroon) 40%, transparent); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--rp-merah) 50%, transparent); border-radius: 32px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); transition: border-color 0.5s; }
    .rp-tentang-misi:hover { border-color: color-mix(in srgb, var(--rp-oranye) 40%, transparent); }
    .rp-tentang-misi h3 { color: var(--rp-kuning); font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 12px; margin: 0 0 24px; }
    .rp-tentang-misi h3 svg { width: 32px; height: 32px; color: var(--rp-oranye); flex-shrink: 0; }
    .rp-misi-list { display: flex; flex-direction: column; gap: 16px; }
    .rp-misi-item { display: flex; gap: 16px; padding: 12px; border-radius: 12px; transition: background-color 0.3s; }
    .rp-misi-item:hover { background: color-mix(in srgb, var(--rp-merah) 20%, transparent); }
    .rp-misi-num { width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); color: var(--rp-oranye); display: flex; align-items: center; justify-content: center; font-weight: 700; transition: background-color 0.2s, color 0.2s; }
    .rp-misi-item:hover .rp-misi-num { background: var(--rp-oranye); color: var(--rp-maroon); }
    .rp-misi-item p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.875rem; line-height: 1.625; padding-top: 4px; margin: 0; }

    /* Tujuan & Rangkaian Kegiatan */
    .rp-tentang-cols { display: grid; grid-template-columns: 1fr; gap: 48px; }
    .rp-tentang-cols-head { margin-bottom: 32px; }
    .rp-tujuan-list { display: flex; flex-direction: column; gap: 16px; }
    .rp-tujuan-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px; border-radius: 16px; border: 1px solid transparent; transition: background-color 0.3s, border-color 0.3s; }
    .rp-tujuan-item:hover { background: linear-gradient(to right, color-mix(in srgb, var(--rp-merah) 20%, transparent), transparent); border-color: color-mix(in srgb, var(--rp-merah) 30%, transparent); }
    .rp-tujuan-icon { color: var(--rp-oranye); flex-shrink: 0; margin-top: 4px; display: inline-flex; transition: transform 0.3s; }
    .rp-tujuan-icon svg { width: 24px; height: 24px; }
    .rp-tujuan-item:hover .rp-tujuan-icon { transform: scale(1.25); }
    .rp-tujuan-item p { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); font-size: 0.875rem; line-height: 1.625; margin: 0; }
    .rp-kegiatan-list { display: flex; flex-direction: column; gap: 12px; }
    .rp-kegiatan-item { display: flex; align-items: center; gap: 20px; background: linear-gradient(to right, color-mix(in srgb, var(--rp-maroon) 60%, transparent), transparent); padding: 16px; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--rp-merah) 30%, transparent); cursor: default; transition: background-color 0.3s, border-color 0.3s, transform 0.3s; }
    .rp-kegiatan-item:hover { background: color-mix(in srgb, var(--rp-merah) 30%, transparent); border-color: color-mix(in srgb, var(--rp-oranye) 50%, transparent); transform: translateX(12px); }
    .rp-kegiatan-num { width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px; background: var(--rp-merah); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); color: var(--rp-kuning); display: flex; align-items: center; justify-content: center; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); transition: background-color 0.3s, color 0.3s; }
    .rp-kegiatan-item:hover .rp-kegiatan-num { background: var(--rp-oranye); color: var(--rp-maroon); }
    .rp-kegiatan-text { color: var(--rp-krem); font-weight: 500; font-size: 0.875rem; transition: color 0.3s; }
    .rp-kegiatan-item:hover .rp-kegiatan-text { color: #fff; }

    @media (min-width: 768px) {
      .rp-tentang-h1 { font-size: 3rem; }
      .rp-tentang-theme-card p { font-size: 1.25rem; }
      .rp-tentang-desc { padding: 48px; }
      .rp-tentang-desc p { text-align: center; }
      .rp-tentang-visi { padding: 40px; }
      .rp-tentang-misi { padding: 40px; }
      .rp-misi-item p { font-size: 1rem; }
      .rp-tujuan-item p { font-size: 1rem; }
      .rp-kegiatan-text { font-size: 1rem; }
    }
    @media (min-width: 1024px) {
      .rp-tentang-vm { grid-template-columns: 5fr 7fr; }
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
