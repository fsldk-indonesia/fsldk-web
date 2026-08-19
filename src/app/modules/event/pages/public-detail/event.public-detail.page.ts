import { Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Event } from '../../entities/event';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { EventPublicDetailPresenter } from './event.public-detail.presenter';
import { EventPublicDetailView } from './event.public-detail.view';

@Component({
  selector: 'app-event-public-detail-page',
  standalone: true,
  templateUrl: './event.public-detail.page.html',
  imports: [RouterLink, DatePipe, CommentSectionComponent],
  providers: [EventPublicDetailPresenter],
  styles: [`
    /* Clean layout consistent with news & article detail pages */
    .crumb { color: var(--color-muted); font-size: .9rem; margin-bottom: 16px; }
    h1 { margin: 12px 0; font-size: clamp(1.8rem, 4vw, 2.6rem); }
    .meta { color: var(--color-muted); font-size: .92rem; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .cover { width: 100%; border-radius: var(--radius-lg); margin: 20px 0 28px; aspect-ratio: 16/9; object-fit: cover; }
    .cover.placeholder { background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-primary-dark); letter-spacing: .1em; font-weight: 700; }

    /* Layout grid: content + event sidebar */
    .detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 36px; margin-top: 24px; align-items: start; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    /* Tabs */
    .tab-bar { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); margin-bottom: 24px; }
    .tab-btn { padding: 10px 20px; font-weight: 600; font-size: .9rem; color: var(--color-muted); cursor: pointer;
      border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color .2s, border-color .2s; }
    .tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    .content-html { font-size: 1.08rem; line-height: 1.85; color: var(--color-text); }
    .content-html ::ng-deep p { margin: 0 0 1.2em; }

    /* Sidebar info cards */
    .info-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 22px; margin-bottom: 18px; }
    .info-card h4 { margin: 0 0 14px; font-size: .95rem; font-weight: 700; }
    .info-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; font-size: .88rem; color: var(--color-text-secondary); }
    .info-icon { flex-shrink: 0; width: 20px; text-align: center; }

    /* Countdown */
    .countdown { display: flex; gap: 8px; justify-content: center; margin: 14px 0; }
    .cd-unit { text-align: center; background: var(--color-primary-soft); border-radius: var(--radius-md); padding: 10px 12px; min-width: 54px; }
    .cd-val { font-size: 1.5rem; font-weight: 800; line-height: 1; color: var(--color-primary-dark); display: block; }
    .cd-lbl { font-size: .65rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-muted); margin-top: 4px; display: block; }

    /* Registration */
    .regist-deadline { display: flex; align-items: center; justify-content: space-between; font-size: .82rem; margin-bottom: 14px; }
    .urgent-badge { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 2px 8px; border-radius: var(--radius-full); font-weight: 700; font-size: .72rem; }

    /* Share */
    .share-box { margin-top: 36px; padding: 20px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    .share-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .share-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--radius-md); font-size: .82rem; font-weight: 600;
      border: 1px solid var(--color-border); background: #fff; cursor: pointer; transition: background .15s, border-color .15s; }
    .share-btn:hover { background: var(--color-bg-warm); border-color: var(--color-primary); }
    .copied-msg { font-size: .78rem; color: var(--color-success, #16a34a); margin-top: 8px; }

    /* Doc links */
    .doc-link { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); margin-bottom: 12px; text-decoration: none; color: inherit; transition: box-shadow .15s, border-color .15s; background: #fff; }
    .doc-link:hover { box-shadow: var(--shadow); border-color: var(--color-primary); text-decoration: none; }
  `],
})
export class EventPublicDetailPage implements OnInit, OnDestroy, EventPublicDetailView {
  private presenter = inject(EventPublicDetailPresenter);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  item = signal<Event | null>(null);
  loading = signal(true);
  activeTab = signal<'description' | 'docs'>('description');
  copied = signal(false);

  // Countdown state
  countdown = signal({ d: 0, h: 0, m: 0, s: 0 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  isUrgent = computed(() => {
    const e = this.item();
    if (!e || !e.registOpen || !e.closeRegistDate) return false;
    const diff = new Date(e.closeRegistDate).getTime() - Date.now();
    return diff > 0 && diff <= 72 * 60 * 60 * 1000;
  });

  canRegist = computed(() => {
    const e = this.item();
    return !!e && e.registOpen && !!e.registrationLink;
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.route.snapshot.paramMap.get('slug')!);
  }

  ngOnDestroy(): void { this.stopCountdown(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }

  setEvent(event: Event | null): void {
    this.item.set(event);
    if (event?.status === 'upcoming' && event.startDate) {
      this.startCountdown(new Date(event.startDate));
    }
  }

  private startCountdown(target: Date): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.tickCountdown(target);
    this.countdownInterval = setInterval(() => this.tickCountdown(target), 1000);
  }

  private tickCountdown(target: Date): void {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) { this.stopCountdown(); this.countdown.set({ d: 0, h: 0, m: 0, s: 0 }); return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.countdown.set({ d, h, m, s });
  }

  private stopCountdown(): void {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
  }

  copyUrl(): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(location.href).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  whatsappUrl(): string { return `https://wa.me/?text=${encodeURIComponent((this.item()?.eventTitle ?? '') + ' ' + (isPlatformBrowser(this.platformId) ? location.href : ''))}`; }
  twitterUrl(): string  { return `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.item()?.eventTitle ?? '')}&url=${encodeURIComponent(isPlatformBrowser(this.platformId) ? location.href : '')}`; }

  statusLabel(s: string): string {
    return ({ upcoming: 'Akan Datang', ongoing: 'Berlangsung', past: 'Telah Selesai' } as Record<string, string>)[s] ?? s;
  }

  deadlineDaysLeft(): number {
    const e = this.item();
    if (!e?.closeRegistDate) return 0;
    return Math.ceil((new Date(e.closeRegistDate).getTime() - Date.now()) / 86400000);
  }

  pad(n: number): string { return String(n).padStart(2, '0'); }
}
