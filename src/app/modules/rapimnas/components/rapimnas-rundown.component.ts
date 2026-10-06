import { Component, Input, signal } from '@angular/core';
import { RapimnasRundownDay } from '../entities/rapimnas';

@Component({
  selector: 'app-rapimnas-rundown',
  standalone: true,
  template: `
    <div class="rp-rundown">
      <div class="rp-rundown-tabs">
        @for (day of days; track $index) {
          <button type="button" class="rp-rundown-tab" [class.active]="activeTab() === $index" (click)="activeTab.set($index)">{{ day.dayLabel }}</button>
        }
      </div>

      @if (days[activeTab()]; as activeDay) {
        <div class="rp-rundown-content">
          <div class="rp-rundown-line"></div>
          <h3 class="rp-rundown-date">{{ activeDay.dateText }}</h3>
          @for (event of activeDay.events; track $index) {
            <div class="rp-rundown-event">
              <span class="rp-rundown-dot"></span>
              <div class="rp-rundown-card">
                @if (event.time) { <span class="rp-rundown-time">{{ event.time }}</span> }
                <h4 class="rp-rundown-title">{{ event.title }}</h4>
                <p class="rp-rundown-desc">{{ event.description }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rp-rundown { max-width: 896px; margin: 0 auto; padding: 0 16px; }
    .rp-rundown-tabs { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 48px; }
    .rp-rundown-tab { padding: 12px 24px; border-radius: 999px; font-weight: 600; border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); background: color-mix(in srgb, var(--rp-maroon) 40%, transparent); color: color-mix(in srgb, var(--rp-krem) 70%, transparent); cursor: pointer; transition: all .2s ease; }
    .rp-rundown-tab:hover { background: color-mix(in srgb, var(--rp-merah) 50%, transparent); color: var(--rp-krem); }
    .rp-rundown-tab.active { background: var(--rp-oranye); color: var(--rp-maroon); border-color: var(--rp-oranye); transform: scale(1.05); }
    .rp-rundown-content { position: relative; padding-left: 48px; }
    .rp-rundown-line { position: absolute; left: 15px; top: 0; bottom: 0; width: 4px; background: color-mix(in srgb, var(--rp-merah) 30%, transparent); border-radius: 999px; }
    .rp-rundown-date { font-size: 1.5rem; font-weight: 700; color: var(--rp-kuning); margin: 0 0 24px; display: flex; align-items: center; gap: 12px; }
    .rp-rundown-event { position: relative; margin-bottom: 32px; }
    .rp-rundown-dot { position: absolute; left: -33px; top: 6px; width: 16px; height: 16px; border-radius: 50%; background: var(--rp-maroon); border: 2px solid var(--rp-oranye); }
    .rp-rundown-card { background: color-mix(in srgb, var(--rp-maroon) 30%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); padding: 24px; border-radius: 16px; }
    .rp-rundown-time { display: inline-block; padding: 4px 12px; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); color: var(--rp-kuning); font-size: 0.75rem; font-weight: 700; border-radius: 8px; margin-bottom: 12px; }
    .rp-rundown-title { font-size: 1.25rem; font-weight: 700; color: var(--rp-krem); margin: 0 0 8px; }
    .rp-rundown-desc { font-size: 0.95rem; color: color-mix(in srgb, var(--rp-krem) 80%, transparent); line-height: 1.6; margin: 0; }
    @media (min-width: 768px) { .rp-rundown-content { padding-left: 80px; } .rp-rundown-dot { left: -65px; } }
  `],
})
export class RapimnasRundownComponent {
  @Input({ required: true }) days: RapimnasRundownDay[] = [];

  activeTab = signal(0);
}
