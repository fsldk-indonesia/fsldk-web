import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

@Component({
  selector: 'app-rapimnas-countdown',
  standalone: true,
  template: `
    <div class="rp-countdown">
      <span class="rp-countdown-label">Menuju Acara</span>
      <div class="rp-countdown-digits">
        <div class="rp-countdown-unit"><span class="rp-countdown-value">{{ pad(timeLeft().days) }}</span><span class="rp-countdown-unit-label">Hari</span></div>
        <span class="rp-countdown-sep">:</span>
        <div class="rp-countdown-unit"><span class="rp-countdown-value">{{ pad(timeLeft().hours) }}</span><span class="rp-countdown-unit-label">Jam</span></div>
        <span class="rp-countdown-sep">:</span>
        <div class="rp-countdown-unit"><span class="rp-countdown-value">{{ pad(timeLeft().minutes) }}</span><span class="rp-countdown-unit-label">Mnt</span></div>
        <span class="rp-countdown-sep">:</span>
        <div class="rp-countdown-unit"><span class="rp-countdown-value">{{ pad(timeLeft().seconds) }}</span><span class="rp-countdown-unit-label">Dtk</span></div>
      </div>
    </div>
  `,
  styles: [`
    .rp-countdown { margin-top: 32px; display: inline-flex; flex-direction: column; align-items: center; gap: 12px; background: color-mix(in srgb, var(--rp-merah) 40%, transparent); backdrop-filter: blur(6px); border: 1px solid color-mix(in srgb, var(--rp-oranye) 40%, transparent); padding: 12px 24px; border-radius: 999px; box-shadow: 0 4px 14px rgba(0,0,0,.2); }
    .rp-countdown-label { color: var(--rp-krem); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .rp-countdown-digits { display: flex; align-items: center; gap: 12px; color: var(--rp-kuning); font-weight: 700; }
    .rp-countdown-unit { display: flex; align-items: baseline; gap: 4px; }
    .rp-countdown-value { font-size: 1.5rem; }
    .rp-countdown-unit-label { font-size: 0.7rem; font-weight: 500; color: var(--rp-krem); }
    .rp-countdown-sep { color: var(--rp-oranye); animation: rp-pulse 1.4s ease-in-out infinite; }
    @keyframes rp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
    @media (min-width: 640px) {
      .rp-countdown { flex-direction: row; gap: 24px; padding: 14px 32px; }
      .rp-countdown-value { font-size: 1.875rem; }
    }
  `],
})
export class RapimnasCountdownComponent implements OnInit, OnDestroy {
  @Input({ required: true }) targetDate!: string;

  timeLeft = signal<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const target = new Date(this.targetDate).getTime();
    this.intervalId = setInterval(() => {
      const distance = target - Date.now();
      if (distance < 0) {
        clearInterval(this.intervalId);
        return;
      }
      this.timeLeft.set({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  pad(n: number): string { return n.toString().padStart(2, '0'); }
}
