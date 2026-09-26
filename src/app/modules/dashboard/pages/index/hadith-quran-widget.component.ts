import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/icon.component';
import { HadithQuranContent, HadithQuranService } from '../../../../core/services/hadith-quran.service';

const ROTATE_SECONDS = 60;
const RETRY_DELAY_MS = 3000;
const MAX_RETRY = 5;

/**
 * Widget "Hadis & Al-Qur'an Harian" — bergantian menampilkan satu hadis acak
 * (6 kitab utama) atau satu ayat Al-Qur'an acak setiap 60 detik, referensi
 * langsung dari widget serupa di dashboard admin ldksyahid-app.
 *
 * Panggil `fetch` browser langsung ke API publik pihak ketiga (BUKAN lewat
 * ApiService) — pola yang sama dipakai PrayerTimeComponent — supaya
 * authInterceptor/errorInterceptor global tidak ikut kena ke domain di luar
 * backend sendiri.
 */
@Component({
  selector: 'app-hadith-quran-widget',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="hq-card">
      <div class="hq-head">
        <h3><app-icon name="book-open" [size]="17" /> Hadis &amp; Al-Qur'an Harian</h3>
        <div class="hq-actions">
          @if (!loading() && !failed()) {
            <span class="hq-countdown">Berganti {{ countdown() }}d</span>
          }
          <button type="button" class="hq-refresh" (click)="refresh()" title="Perbarui sekarang" aria-label="Perbarui sekarang">
            <app-icon name="refresh" [size]="12" />
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="hq-skel">
          <span class="skel skel-line" style="width:35%;height:20px"></span>
          <span class="skel skel-line" style="width:100%"></span>
          <span class="skel skel-line" style="width:92%"></span>
          <span class="skel skel-line" style="width:60%"></span>
        </div>
      } @else if (failed()) {
        <p class="hq-error">Konten tidak tersedia saat ini. Coba lagi nanti.</p>
      } @else {
        <div class="hq-body" [class.is-fading]="fading()">
          <div class="hq-meta">
            <span class="hq-badge" [class.quran]="isQuran()">{{ sourceLabel() }}</span>
            <span class="hq-number">{{ numberLabel() }}</span>
          </div>
          <div class="hq-text-wrapper" #wrapperEl [class.expanded]="expanded()" [class.no-clamp]="!overflowing()">
            @if (arabic()) { <p class="hq-arabic">{{ arabic() }}</p> }
            <p class="hq-translation">&ldquo;{{ translation() }}&rdquo;</p>
          </div>
          @if (overflowing()) {
            <button type="button" class="hq-toggle" (click)="toggleExpanded()">
              {{ expanded() ? 'Lihat Lebih Sedikit' : 'Lihat Selengkapnya' }}
              <app-icon name="chevron-down" [size]="11" [class.is-expanded]="expanded()" />
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .hq-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 22px 24px; }
    .hq-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .hq-head h3 { display: flex; align-items: center; gap: 9px; margin: 0; font-size: 1.05rem; }
    .hq-actions { display: flex; align-items: center; gap: 10px; }
    .hq-countdown { font-size: .78rem; color: var(--color-muted); font-weight: 600; white-space: nowrap; }
    .hq-refresh {
      width: 28px; height: 28px; border-radius: var(--radius-full); border: 1px solid var(--color-border);
      background: #fff; color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .hq-refresh:hover { background: var(--color-primary-soft); transform: rotate(50deg); }

    .hq-skel { display: flex; flex-direction: column; gap: 10px; }
    .hq-error { color: var(--color-muted); font-size: .9rem; margin: 0; }

    .hq-body { transition: opacity var(--motion-slow) ease; }
    .hq-body.is-fading { opacity: 0; }
    .hq-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .hq-badge { background: var(--color-primary); color: #fff; font-size: .74rem; font-weight: 700; padding: 4px 12px; border-radius: var(--radius-full); white-space: nowrap; }
    .hq-badge.quran { background: var(--color-gold); }
    .hq-number { font-size: .8rem; color: var(--color-muted); font-weight: 600; }
    .hq-arabic { font-family: 'Traditional Arabic', 'Scheherazade New', serif; font-size: 1.45rem; line-height: 2.1; text-align: right; direction: rtl; color: var(--color-text); margin: 0 0 12px; }
    .hq-translation { font-family: var(--font-accent); font-style: italic; font-size: 1rem; line-height: 1.75; color: var(--color-text-secondary); margin: 0; }

    /* Diciutkan secara default (mis. ayat panjang) — persis perilaku widget
       serupa di ldksyahid-app: teks penuh tidak langsung tampil semua,
       harus diklik "Lihat Selengkapnya" dulu. */
    .hq-text-wrapper { max-height: 158px; overflow: hidden; transition: max-height var(--motion-slow, .3s) ease; position: relative; }
    .hq-text-wrapper.expanded { max-height: 2000px; }
    .hq-text-wrapper:not(.expanded):not(.no-clamp)::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
      background: linear-gradient(to bottom, transparent, #fff); pointer-events: none;
    }
    .hq-toggle {
      display: inline-flex; align-items: center; gap: 5px; background: transparent; border: none;
      color: var(--color-primary-dark); font-size: .85rem; font-weight: 700; padding: 0; margin-top: 12px; cursor: pointer;
    }
    .hq-toggle:hover { text-decoration: underline; }
    .hq-toggle app-icon { transition: transform var(--motion-fast) ease; display: inline-flex; }
    .hq-toggle app-icon.is-expanded { transform: rotate(180deg); }

    @media (max-width: 600px) {
      .hq-card { padding: 18px; }
      .hq-arabic { font-size: 1.2rem; }
    }
  `],
})
export class HadithQuranWidgetComponent implements OnInit, OnDestroy {
  private hadithQuran = inject(HadithQuranService);

  @ViewChild('wrapperEl') private wrapperRef?: ElementRef<HTMLDivElement>;

  loading = signal(true);
  failed = signal(false);
  fading = signal(false);
  arabic = signal('');
  translation = signal('');
  sourceLabel = signal('');
  numberLabel = signal('');
  isQuran = signal(false);
  countdown = signal(ROTATE_SECONDS);
  expanded = signal(false);
  overflowing = signal(false);

  private contentType: 'hadith' | 'quran' = Math.random() < 0.5 ? 'hadith' : 'quran';
  private countdownTimer?: ReturnType<typeof setInterval>;
  private retryTimeout?: ReturnType<typeof setTimeout>;
  private retryCount = 0;
  private fetchToken = 0;

  ngOnInit(): void {
    this.fetchContent();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownTimer);
    clearTimeout(this.retryTimeout);
  }

  refresh(): void {
    this.retryCount = 0;
    clearTimeout(this.retryTimeout);
    this.contentType = Math.random() < 0.5 ? 'hadith' : 'quran';
    this.fetchContent();
  }

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  private startCountdown(): void {
    clearInterval(this.countdownTimer);
    this.countdown.set(ROTATE_SECONDS);
    this.countdownTimer = setInterval(() => {
      this.countdown.update((v) => v - 1);
      if (this.countdown() <= 0) {
        this.contentType = this.contentType === 'hadith' ? 'quran' : 'hadith';
        this.fetchContent();
      }
    }, 1000);
  }

  private async fetchContent(): Promise<void> {
    const token = ++this.fetchToken;
    if (!this.loading()) this.fading.set(true);
    try {
      const content = await this.hadithQuran.fetchRandom(this.contentType);
      if (token !== this.fetchToken) return;
      this.applyContent(content);
    } catch {
      if (token === this.fetchToken) this.scheduleRetry();
    }
  }

  private applyContent(content: HadithQuranContent): void {
    this.arabic.set(content.arabic);
    this.translation.set(content.translation);
    this.sourceLabel.set(content.sourceLabel);
    this.numberLabel.set(content.numberLabel);
    this.isQuran.set(content.isQuran);
    this.failed.set(false);
    this.loading.set(false);
    this.fading.set(false);
    this.retryCount = 0;
    this.countdown.set(ROTATE_SECONDS);
    // Konten baru selalu mulai diciutkan lagi (default belum-dibaca-penuh),
    // baru dicek apakah teksnya memang melebihi tinggi ciutan setelah DOM
    // sempat di-render ulang oleh Angular (makanya ditunda satu tick).
    this.expanded.set(false);
    setTimeout(() => this.checkOverflow(), 50);
  }

  private checkOverflow(): void {
    const el = this.wrapperRef?.nativeElement;
    if (!el) { this.overflowing.set(false); return; }
    this.overflowing.set(el.scrollHeight > el.clientHeight + 4);
  }

  private scheduleRetry(): void {
    this.retryCount++;
    if (this.retryCount <= MAX_RETRY) {
      this.retryTimeout = setTimeout(() => this.fetchContent(), RETRY_DELAY_MS);
    } else {
      this.loading.set(false);
      this.failed.set(true);
      this.retryCount = 0;
    }
  }
}
