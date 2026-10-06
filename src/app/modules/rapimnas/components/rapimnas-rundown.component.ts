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
          <h3 class="rp-rundown-date">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="rp-rundown-date-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {{ activeDay.dateText }}
          </h3>
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
    .rp-rundown-tab { padding: 12px 24px; border-radius: 999px; font-weight: 600; border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); background: color-mix(in srgb, var(--rp-maroon) 40%, transparent); color: color-mix(in srgb, var(--rp-krem) 70%, transparent); cursor: pointer; transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-rundown-tab:hover { background: color-mix(in srgb, var(--rp-merah) 50%, transparent); color: var(--rp-krem); }
    .rp-rundown-tab.active { background: var(--rp-oranye); color: var(--rp-maroon); border-color: var(--rp-oranye); box-shadow: 0 0 15px rgba(254, 112, 2, 0.5); transform: scale(1.05); }
    .rp-rundown-content { position: relative; padding-left: 48px; }
    .rp-rundown-line { position: absolute; left: 16px; top: 0; bottom: 0; width: 4px; background: color-mix(in srgb, var(--rp-merah) 30%, transparent); border-radius: 999px; }
    .rp-rundown-date { font-size: 1.5rem; font-weight: 700; line-height: 2rem; color: var(--rp-kuning); margin: 0 0 24px; display: flex; align-items: center; gap: 12px; }
    .rp-rundown-date-icon { width: 24px; height: 24px; flex-shrink: 0; }
    .rp-rundown-event { position: relative; margin-top: 32px; }
    .rp-rundown-dot { position: absolute; left: -34.4px; top: 6px; width: 16px; height: 16px; border-radius: 50%; background: var(--rp-maroon); border: 2px solid var(--rp-oranye); transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); z-index: 10; }
    .rp-rundown-event:hover .rp-rundown-dot { background: var(--rp-oranye); transform: scale(1.5); box-shadow: 0 0 10px var(--rp-oranye); }
    .rp-rundown-card { background: color-mix(in srgb, var(--rp-maroon) 30%, transparent); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--rp-merah) 40%, transparent); padding: 24px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-rundown-event:hover .rp-rundown-card { border-color: color-mix(in srgb, var(--rp-oranye) 50%, transparent); background: color-mix(in srgb, var(--rp-maroon) 60%, transparent); transform: translateY(-4px); }
    .rp-rundown-time { display: inline-block; padding: 4px 12px; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); color: var(--rp-kuning); font-size: 0.75rem; font-weight: 700; border-radius: 8px; margin-bottom: 12px; }
    .rp-rundown-title { font-size: 1.25rem; font-weight: 700; line-height: 1.75rem; color: var(--rp-krem); margin: 0 0 8px; }
    .rp-rundown-desc { font-size: 0.875rem; color: color-mix(in srgb, var(--rp-krem) 80%, transparent); line-height: 1.625; margin: 0; }
    @media (min-width: 768px) {
      .rp-rundown-tabs { gap: 16px; }
      .rp-rundown-content { padding-left: 80px; }
      .rp-rundown-line { left: 32px; }
      .rp-rundown-dot { left: -50.4px; }
      .rp-rundown-desc { font-size: 1rem; }
    }
  `],
})
export class RapimnasRundownComponent {
  @Input({ required: true }) days: RapimnasRundownDay[] = [];

  activeTab = signal(0);
}
