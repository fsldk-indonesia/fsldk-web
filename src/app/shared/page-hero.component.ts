import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, input, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { HadithQuranContent, HadithQuranService } from '../core/services/hadith-quran.service';

const QUOTE_ROTATE_SECONDS = 60;
const QUOTE_RETRY_DELAY_MS = 3000;
const QUOTE_MAX_RETRY = 5;

/**
 * Hero publik reusable — "mesin visual" (gradient/tekstur/glow/wave) diambil
 * PERSIS dari Beranda supaya semua halaman publik terasa satu bahasa desain.
 * Diekstrak dari halaman Struktur agar bisa dipakai lintas modul: pemanggil
 * tinggal mengisi teks (badge/title/titleAccent/subtitle), memilih sumber
 * kutipan (hadith/quran), dan MEMPROYEKSIKAN ilustrasi sisi kanannya sendiri
 * lewat slot `[heroVisual]` (mis. siluet pohon di Struktur) — beserta style &
 * animasi ilustrasi itu yang tetap milik pemanggil (projected content di-style
 * oleh komponen yang mendeklarasikannya, bukan komponen ini).
 *
 * Kartu kutipan Hadis/Al-Qur'an + seluruh logikanya (fetch acak, rotasi tiap
 * 60 detik, expand/collapse, retry) ikut di sini karena itu bagian tetap hero.
 * Sumbernya HadithQuranService (fetch langsung ke API publik, lihat service).
 */
@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [IconComponent],
  template: `
    <!-- Header publik di halaman-halaman ini TIDAK transparan-menembus seperti
         di Beranda (lihat isHomeRoute() di site-header.component.ts, sengaja
         hanya utk Beranda) — jadi padding-top hero ini normal, bukan 144px
         kompensasi margin negatif. -->
    <section class="hero">
      <div class="hero-texture" aria-hidden="true"></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="hero-badge"><span class="hero-badge-dot"></span> {{ badge() }}</span>
          <h1 class="hero-title">{{ title() }} <span class="hero-title-accent">{{ titleAccent() }}</span></h1>
          <p class="hero-sub">{{ subtitle() }}</p>
        </div>

        <div class="hero-org">
          <!-- Ilustrasi sisi kanan diproyeksikan pemanggil (mis. siluet pohon
               Struktur). Style & animasinya milik pemanggil. -->
          <ng-content select="[heroVisual]" />

          <!-- .org-quote-anchor: placeholder TINGGI TETAP di normal flow (jadi
               .hero-org/.hero-grid/.hero TIDAK ikut tumbuh tinggi saat kartu
               di-expand) — kartu sungguhannya (.org-quote) absolute di dalamnya,
               jadi bebas memanjang ke bawah menembus zona wave sebagai overlay
               murni, TANPA mendorong section/wave ikut turun. -->
          <div class="org-quote-anchor">
          <div class="org-quote" [class.is-fading]="quoteFading()">
            <div class="org-quote-head">
              @if (!quoteLoading() && !quoteFailed()) {
                <span class="org-quote-badge" [class.quran]="quoteIsQuran()">{{ quoteSourceLabel() }}</span>
                <span class="org-quote-countdown">{{ quoteSource() === 'quran' ? 'Ayat' : 'Hadis' }} berikutnya dalam {{ quoteCountdown() }} detik</span>
              }
            </div>

            @if (quoteLoading()) {
              <div class="org-quote-skel">
                <span class="skel skel-line" style="width:100%"></span>
                <span class="skel skel-line" style="width:88%"></span>
                <span class="skel skel-line" style="width:55%"></span>
              </div>
            } @else if (quoteFailed()) {
              <p class="org-quote-error">Kutipan tidak tersedia saat ini.</p>
            } @else {
              <div class="org-quote-text-wrap" #quoteWrapperEl [class.expanded]="quoteExpanded()" [class.no-clamp]="!quoteOverflowing()">
                @if (quoteArabic()) { <p class="org-quote-arabic">{{ quoteArabic() }}</p> }
                <p class="org-quote-translation">&ldquo;{{ quoteTranslation() }}&rdquo;</p>
              </div>
              @if (quoteOverflowing()) {
                <button type="button" class="org-quote-toggle" (click)="toggleQuoteExpanded()">
                  {{ quoteExpanded() ? 'Lihat Lebih Sedikit' : 'Lihat Selengkapnya' }}
                  <app-icon name="chevron-down" [size]="11" [class.is-expanded]="quoteExpanded()" />
                </button>
              }
              <cite class="org-quote-source">{{ quoteNumberLabel() }}</cite>
            }
          </div>
          </div>
        </div>
      </div>

      <div class="hero-wave" aria-hidden="true">
        <div class="hero-wave-clip">
          <svg viewBox="0 0 2880 80" preserveAspectRatio="none">
            <path d="M0,40 C240,70 480,10 720,40 C960,70 1200,10 1440,40 C1680,70 1920,10 2160,40 C2400,70 2640,10 2880,40 L2880,80 L0,80 Z" [style.fill]="waveColor()" />
          </svg>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* z-index:5 eksplisit di .hero — supaya .org-quote yang menembus ke bawah
       wave menang tampil di atas section berikutnya (sibling .hero). */
    /* overflow-x: clip + overflow-y: visible (BUKAN overflow: hidden): overflow
       hidden akan MEMOTONG kartu .org-quote yang di-expand tepat di batas bawah
       hero (jadi "ketiban" section di bawahnya). overflow-y: visible membiarkan
       kartu memanjang menembus sebagai overlay; overflow-x: clip tetap menahan
       tekstur/gelombang agar tak bikin horizontal scroll. */
    .hero { position: relative; z-index: 5; background: linear-gradient(122deg, var(--color-primary-tint) 0%, var(--color-primary-soft) 58%, var(--color-gold-soft) 100%); padding: 64px 0 56px; overflow-x: clip; overflow-y: visible; }
    .hero::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom, transparent 0, transparent calc(100% - 80px), var(--color-primary-tint) 100%);
    }
    .hero::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 60% 70% at 78% 60%, var(--color-gold-soft) 0%, var(--color-primary-soft) 40%, transparent 75%);
      opacity: .9;
    }
    .hero-texture {
      position: absolute; inset: 0; opacity: .7; pointer-events: none;
      background-image: radial-gradient(circle, var(--color-primary-soft) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 80% -10px;
      mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
    }
    /* drop-shadow blur (7) < offset ke atas (9) — supaya ekor bawah shadow tak
       bocor ke tepi atas section (yang tak ter-clip karena .hero overflow-y
       visible) sebagai garis gelap, tapi bayangan crest tetap terangkat. */
    .hero-wave { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; height: 80px; line-height: 0; pointer-events: none; filter: drop-shadow(0 -9px 7px rgba(0,0,0,.12)); }
    .hero-wave-clip { width: 100%; height: 100%; overflow: hidden; }
    .hero-wave-clip svg { display: block; width: 200%; height: 80px; animation: heroWaveScroll 14s linear infinite; }
    @keyframes heroWaveScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    .hero-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1.25fr; gap: 32px; align-items: center; }
    .hero-copy { position: relative; z-index: 2; }
    .hero-badge, .hero-title, .hero-sub { opacity: 0; animation: heroFadeUp .7s var(--ease-out) forwards; }
    .hero-badge { animation-delay: .05s; }
    .hero-title { animation-delay: .2s; }
    .hero-sub { animation-delay: .35s; }
    @keyframes heroFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .hero-badge { display: inline-flex; align-items: center; gap: 9px; background: #fff; border: 1px solid var(--color-gold); color: var(--color-gold-dark); padding: 8px 18px; border-radius: var(--radius-full); font-weight: 700; font-size: .85rem; margin-bottom: 24px; box-shadow: var(--shadow-sm); }
    .hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; animation: node-pulse 2.4s ease-in-out infinite; }
    .hero-title { font-family: var(--font-display); font-size: clamp(2.1rem, 4.6vw, 3.2rem); font-weight: 800; letter-spacing: -.01em; max-width: 17ch; line-height: 1.14; }
    .hero-title-accent { font-family: var(--font-accent); font-style: italic; font-weight: 600; color: var(--color-primary-dark); }
    .hero-sub { max-width: 46ch; font-size: 1.05rem; color: var(--color-text-secondary); }

    /* Kontainer kolom kanan hero — memuat ilustrasi yang diproyeksikan
       pemanggil (lewat [heroVisual]) di atas kartu kutipan. */
    .hero-org { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }

    /* ---------- Kutipan Hadis/Al-Qur'an — kartu kaca translucent. .org-quote-anchor
       TINGGI TETAP menjaga hero tak berubah tinggi; kartu asli absolute di dalamnya
       bebas memanjang ke bawah sebagai overlay. ---------- */
    .org-quote-anchor { position: relative; z-index: 1; width: 100%; max-width: 460px; height: 220px; }
    .org-quote {
      position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 18px 20px; box-sizing: border-box;
      background: rgba(255,255,255,.92); backdrop-filter: blur(6px);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      opacity: 0; animation: heroFadeUp .6s var(--ease-out) 1.3s forwards;
      transition: opacity var(--motion-slow) ease;
    }
    .org-quote.is-fading { opacity: .45; }
    .org-quote-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 20px; margin-bottom: 10px; }
    .org-quote-badge { background: var(--color-primary); color: #fff; font-size: .68rem; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); white-space: nowrap; }
    .org-quote-badge.quran { background: var(--color-gold); }
    .org-quote-countdown { font-size: .7rem; color: var(--color-muted); font-weight: 600; white-space: nowrap; }

    .org-quote-skel { display: flex; flex-direction: column; gap: 8px; }
    .org-quote-error { color: var(--color-muted); font-size: .82rem; margin: 0; }

    .org-quote-arabic { font-family: 'Traditional Arabic', 'Scheherazade New', serif; font-size: 1.15rem; line-height: 1.9; text-align: right; direction: rtl; color: var(--color-text); margin: 0 0 8px; }
    .org-quote-translation { font-family: var(--font-accent); font-style: italic; font-size: .88rem; line-height: 1.6; color: var(--color-text-secondary); margin: 0; }

    /* Clamp preview -> penuh, dengan fade mask di tepi bawah saat diciutkan.
       max-height 84px SELALU aktif (.no-clamp cuma mematikan fade mask) supaya
       deteksi overflow tidak rusak — lihat komentar aslinya di Struktur. */
    .org-quote-text-wrap { max-height: 84px; overflow: hidden; transition: max-height var(--motion-slow, .3s) ease; position: relative; }
    .org-quote-text-wrap.expanded { max-height: 600px; }
    .org-quote-text-wrap:not(.expanded):not(.no-clamp)::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 28px;
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,.92)); pointer-events: none;
    }
    /* Pill button (border tipis + rounded-full + chevron) — palet hijau FSLDK. */
    .org-quote-toggle {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; cursor: pointer;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full);
      color: var(--color-primary-dark); font-size: .78rem; font-weight: 700; padding: 7px 16px;
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .org-quote-toggle:hover { background: var(--color-primary-soft); border-color: var(--color-primary-soft); }
    .org-quote-toggle app-icon { transition: transform var(--motion-fast) ease; display: inline-flex; }
    .org-quote-toggle app-icon.is-expanded { transform: rotate(180deg); }
    .org-quote-source { display: block; margin-top: 10px; font-size: .74rem; font-style: normal; color: var(--color-muted); font-weight: 600; }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; }
      .hero-copy { text-align: center; }
      .hero-sub { margin: 0 auto; }
      .org-quote-anchor { max-width: none; }
      .org-quote-head { justify-content: center; }
    }
  `],
})
export class PageHeroComponent implements OnInit, OnDestroy {
  private hadithQuran = inject(HadithQuranService);

  badge = input<string>('');
  title = input<string>('');
  titleAccent = input<string>('');
  subtitle = input<string>('');
  /** Sumber kutipan: 'quran' (ayat Al-Qur'an acak) atau 'hadith' (hadis acak). */
  quoteSource = input<'hadith' | 'quran'>('quran');
  /** Warna fill .hero-wave — default tint (selaras gradient hero terang).
   *  Dioverride ('var(--color-primary)') oleh pemanggil yang section
   *  berikutnya berwarna hijau solid (mis. News index), supaya wave
   *  animasinya menyambung lurus ke section itu tanpa warna pucat nongol
   *  di antaranya. */
  waveColor = input<string>('var(--color-primary-tint)');

  quoteLoading = signal(true);
  quoteFailed = signal(false);
  quoteFading = signal(false);
  quoteArabic = signal('');
  quoteTranslation = signal('');
  quoteSourceLabel = signal('');
  quoteNumberLabel = signal('');
  quoteIsQuran = signal(false);
  quoteCountdown = signal(QUOTE_ROTATE_SECONDS);
  quoteExpanded = signal(false);
  quoteOverflowing = signal(false);

  private quoteCountdownTimer?: ReturnType<typeof setInterval>;
  private quoteRetryTimeout?: ReturnType<typeof setTimeout>;
  private quoteRetryCount = 0;
  private quoteFetchToken = 0;

  @ViewChild('quoteWrapperEl') private quoteWrapperRef?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.fetchQuote();
    this.startQuoteCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.quoteCountdownTimer);
    clearTimeout(this.quoteRetryTimeout);
  }

  toggleQuoteExpanded(): void {
    this.quoteExpanded.update((v) => !v);
  }

  /** Rotasi otomatis tiap 60 detik — sumbernya dikunci ke quoteSource input
   *  (tidak di-toggle hadis<->ayat seperti widget dashboard CMS). */
  private startQuoteCountdown(): void {
    clearInterval(this.quoteCountdownTimer);
    this.quoteCountdown.set(QUOTE_ROTATE_SECONDS);
    this.quoteCountdownTimer = setInterval(() => {
      this.quoteCountdown.update((v) => v - 1);
      if (this.quoteCountdown() <= 0) {
        this.fetchQuote();
      }
    }, 1000);
  }

  private async fetchQuote(): Promise<void> {
    const token = ++this.quoteFetchToken;
    if (!this.quoteLoading()) this.quoteFading.set(true);
    try {
      const content = await this.hadithQuran.fetchRandom(this.quoteSource());
      if (token !== this.quoteFetchToken) return;
      this.applyQuote(content);
    } catch {
      if (token === this.quoteFetchToken) this.scheduleQuoteRetry();
    }
  }

  private applyQuote(content: HadithQuranContent): void {
    this.quoteArabic.set(content.arabic);
    this.quoteTranslation.set(content.translation);
    this.quoteSourceLabel.set(content.sourceLabel);
    this.quoteNumberLabel.set(content.numberLabel);
    this.quoteIsQuran.set(content.isQuran);
    this.quoteFailed.set(false);
    this.quoteLoading.set(false);
    this.quoteFading.set(false);
    this.quoteRetryCount = 0;
    this.quoteCountdown.set(QUOTE_ROTATE_SECONDS);
    this.quoteExpanded.set(false);
    this.checkQuoteOverflow();
  }

  /** Double rAF — menunggu Angular selesai me-render teks ayat baru sebelum
   *  mengukur scrollHeight vs clientHeight, supaya tombol "Lihat Selengkapnya"
   *  tidak salah hilang untuk teks yang sebenarnya panjang. */
  private checkQuoteOverflow(): void {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = this.quoteWrapperRef?.nativeElement;
      if (!el) { this.quoteOverflowing.set(false); return; }
      this.quoteOverflowing.set(el.scrollHeight > el.clientHeight + 4);
    }));
  }

  private scheduleQuoteRetry(): void {
    this.quoteRetryCount++;
    if (this.quoteRetryCount <= QUOTE_MAX_RETRY) {
      this.quoteRetryTimeout = setTimeout(() => this.fetchQuote(), QUOTE_RETRY_DELAY_MS);
    } else {
      this.quoteLoading.set(false);
      this.quoteFailed.set(true);
      this.quoteRetryCount = 0;
    }
  }
}
