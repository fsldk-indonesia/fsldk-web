import { Component, Input } from '@angular/core';

/**
 * Baris statistik dengan bar proporsional — dipakai untuk widget dashboard
 * bertingkat (rekap status, distribusi level, sebaran per Puskomda) tanpa
 * perlu library chart: satu bar per baris sudah cukup untuk kebutuhan
 * visualisasi di TechSpec (tidak ada interaksi/tooltip/multi-series).
 */
@Component({
  selector: 'app-stat-bar',
  standalone: true,
  template: `
    <div class="stat-bar-row">
      <div class="stat-bar-label">
        <span>{{ label }}</span>
        <strong>{{ value }}</strong>
      </div>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" [style.width.%]="percent()"></div>
      </div>
    </div>
  `,
  styles: [`
    .stat-bar-row { margin-bottom: 12px; }
    .stat-bar-row:last-child { margin-bottom: 0; }
    .stat-bar-label { display: flex; justify-content: space-between; align-items: baseline; font-size: .88rem; margin-bottom: 4px; }
    .stat-bar-label strong { font-size: .95rem; }
    .stat-bar-track { height: 8px; border-radius: 4px; background: var(--color-primary-soft); overflow: hidden; }
    .stat-bar-fill { height: 100%; border-radius: 4px; background: var(--color-primary); transition: width var(--motion-fast, .2s) ease; }
  `],
})
export class StatBarComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() max = 0;

  percent(): number {
    if (!this.max) return 0;
    return Math.min(100, Math.round((this.value / this.max) * 100));
  }
}
