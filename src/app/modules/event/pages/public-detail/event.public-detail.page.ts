import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EventRepository } from '../../repositories/event.repository';
import { Event, EventStatus, EVENT_STATUS_LABEL, EVENT_STATUS_ICON } from '../../entities/event';
import { IconComponent } from '../../../../shared/icon.component';
import { CommentSectionComponent } from '../../../comment/components/comment-section.component';
import { resolveImageUrl, resolveThumbnailUrl } from '../../../../core/utils/image-url';

/** Jumlah kartu "Event Lainnya" yang ditampilkan — diminta 1 lebih dari ini
 *  ke API supaya tetap ada cadangan kalau event yang sedang dibaca kebetulan
 *  ikut ke-fetch (lihat loadRelated()), pola sama Artikel. */
const RELATED_COUNT = 3;

/**
 * Public detail page for a single event — pola sama persis dengan Artikel/
 * Berita/Galeri detail (hero gelap + cover dalam bingkai matte object-fit:
 * contain di kolom kanan, story-grid konten+sidebar di bawahnya), plus
 * fitur unik Event (countdown, kartu pendaftaran, tab Deskripsi/Dokumentasi,
 * narahubung WA) ditanam sebagai detail-card tambahan di sidebar.
 */
@Component({
  selector: 'app-event-public-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, CommentSectionComponent],
  template: `
    @if (repo.loading()) {
      <div class="empty-state py-xl">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat event...</p>
      </div>
    } @else if (repo.error()) {
      <div class="container py-xl text-center">
        <div class="empty-icon text-danger"><app-icon name="alert-triangle" [size]="48" /></div>
        <h3>Terjadi Kesalahan</h3>
        <p class="text-muted">{{ repo.error() }}</p>
        <a routerLink="/event" class="btn btn-outline mt-md">Kembali ke Event</a>
      </div>
    } @else {
      @if (repo.currentEvent(); as e) {
        <header class="hero-section">
          <div class="hero-texture" aria-hidden="true"></div>
          <div class="hero-glow" aria-hidden="true"></div>
          <div class="container hero-grid">
            <div class="hero-copy">
              <div class="hero-badges">
                <span class="hero-tag"><app-icon name="users" [size]="13" /> {{ e.eventDivision }}</span>
                <span class="hero-tag hero-tag-status" [class]="'status-' + e.status">
                  @if (e.status === 'ongoing') { <span class="status-dot"></span> }
                  <app-icon [name]="statusIcon(e.status)" [size]="13" /> {{ statusLabel(e.status) }}
                </span>
              </div>

              <span class="hero-event-name">Agenda &amp; Kegiatan FSLDK Indonesia</span>
              <h1 class="hero-title">{{ e.eventTitle }}</h1>

              <div class="hero-meta-row">
                @if (e.startDate) {
                  <span class="hero-meta-item"><app-icon name="calendar-days" [size]="14" /> {{ e.startDate | date: 'd MMM yyyy':'':'id-ID' }}{{ e.endDate && e.endDate !== e.startDate ? ' – ' + (e.endDate | date: 'd MMM yyyy':'':'id-ID') : '' }}</span>
                }
                @if (e.location) {
                  <span class="hero-meta-item"><app-icon name="map-pin" [size]="14" /> {{ e.location }}{{ e.place ? ', ' + e.place : '' }}</span>
                }
                <span class="hero-meta-item"><app-icon name="eye" [size]="14" /> {{ e.viewCount }} kali dilihat</span>
              </div>
            </div>

            <div class="hero-visual">
              <div class="hero-cover-frame">
                @if (e.eventImage) {
                  <img [src]="imgUrl(e.eventImage)" [alt]="e.eventTitle" class="hero-cover-img" />
                } @else {
                  <div class="hero-cover-fallback"><app-icon name="megaphone" [size]="40" /></div>
                }
              </div>
            </div>
          </div>
        </header>

        <main class="detail-main-section">
          <div class="container">
            <div class="content-layout">
              <nav class="crumb-row" aria-label="Breadcrumb">
                <a routerLink="/" class="crumb-link"><app-icon name="home" [size]="13" /> Beranda</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <a routerLink="/event" class="crumb-link"><app-icon name="megaphone" [size]="13" /> Event</a>
                <app-icon name="chevron-right" [size]="11" class="crumb-sep" />
                <span class="crumb-current" aria-current="page">{{ e.eventTitle }}</span>
              </nav>

              <div class="story-grid">
                <section class="detail-card story-card-content">
                  <div class="content-tab-bar">
                    <button type="button" class="content-tab" [class.active]="activeTab() === 'description'" (click)="activeTab.set('description')">
                      <app-icon name="align-left" [size]="13" /> Deskripsi
                    </button>
                    @if (e.documentLink || e.presentationLink) {
                      <button type="button" class="content-tab" [class.active]="activeTab() === 'docs'" (click)="activeTab.set('docs')">
                        <app-icon name="file-text" [size]="13" /> Dokumentasi &amp; Materi
                      </button>
                    }
                  </div>

                  <!-- Setiap cabang @if DIPISAH per tab (bukan satu wrapper
                       dengan isi dinamis) supaya Angular selalu membongkar-
                       pasang elemen baru tiap ganti tab — itu yang memicu
                       ulang animasi .tab-panel (CSS animation cuma berjalan
                       saat elemen BARU dimasukkan ke DOM, bukan saat konten
                       di dalam elemen yang sama berubah). Pola sama persis
                       catalogbook.public-detail.page.ts (tab Deskripsi/
                       Sinopsis/Diskusi). -->
                  @if (activeTab() === 'description') {
                    <div class="story-lead-text content tab-panel" [innerHTML]="sanitizeHtml(e.eventContent)"></div>
                  } @else {
                    <div class="doc-links tab-panel">
                      @if (e.documentLink) {
                        <a [href]="e.documentLink" target="_blank" rel="noopener noreferrer" class="doc-link">
                          <span class="doc-link-icon"><app-icon name="images" [size]="18" /></span>
                          <span class="doc-link-body">
                            <strong>Foto &amp; Video Dokumentasi</strong>
                            <span>Buka folder dokumentasi di Google Drive</span>
                          </span>
                          <app-icon name="external-link" [size]="14" class="doc-link-arrow" />
                        </a>
                      }
                      @if (e.presentationLink) {
                        <a [href]="e.presentationLink" target="_blank" rel="noopener noreferrer" class="doc-link">
                          <span class="doc-link-icon"><app-icon name="file-bar-chart" [size]="18" /></span>
                          <span class="doc-link-body">
                            <strong>Materi &amp; Presentasi</strong>
                            <span>Buka materi presentasi di Google Drive</span>
                          </span>
                          <app-icon name="external-link" [size]="14" class="doc-link-arrow" />
                        </a>
                      }
                    </div>
                  }

                  <!-- ---------- Share — 3 action-btn pill, pola CTA Artikel. ---------- -->
                  <div class="actions-row">
                    <button type="button" class="action-btn action-btn-outline" (click)="copyUrl()"><app-icon name="link" [size]="15" /> Salin Tautan</button>
                    <a class="action-btn action-btn-outline" [href]="whatsappUrl()" target="_blank" rel="noopener"><app-icon name="whatsapp" [size]="15" /> WhatsApp</a>
                    <a class="action-btn action-btn-outline" [href]="twitterUrl()" target="_blank" rel="noopener"><app-icon name="x-twitter" [size]="15" /> Twitter/X</a>
                  </div>
                  @if (copied()) { <p class="copied-msg"><app-icon name="check-circle" [size]="13" /> Tautan berhasil disalin ke clipboard</p> }
                </section>

                <div class="story-sidebar">
                  @if (e.status === 'upcoming' && e.startDate) {
                    <aside class="detail-card story-card-countdown">
                      <span class="eyebrow"><app-icon name="clock" [size]="13" /> Dimulai Dalam</span>
                      <div class="countdown mt-sm">
                        <div class="cd-unit"><span class="cd-val">{{ pad(countdown().d) }}</span><span class="cd-lbl">Hari</span></div>
                        <div class="cd-unit"><span class="cd-val">{{ pad(countdown().h) }}</span><span class="cd-lbl">Jam</span></div>
                        <div class="cd-unit"><span class="cd-val">{{ pad(countdown().m) }}</span><span class="cd-lbl">Menit</span></div>
                        <div class="cd-unit"><span class="cd-val">{{ pad(countdown().s) }}</span><span class="cd-lbl">Detik</span></div>
                      </div>
                    </aside>
                  }

                  <aside class="detail-card story-card-regist">
                    <span class="eyebrow"><app-icon name="clipboard-check" [size]="13" /> Pendaftaran</span>
                    @if (e.closeRegistDate) {
                      <div class="regist-deadline mt-sm">
                        <span class="regist-deadline-text">Batas: {{ e.closeRegistDate | date: 'd MMM yyyy, HH:mm':'':'id-ID' }}</span>
                        @if (isUrgent()) {
                          <span class="urgent-badge"><app-icon name="alert-triangle" [size]="11" /> {{ deadlineDaysLeft() }} hari lagi</span>
                        }
                      </div>
                    }
                    @if (canRegist()) {
                      <a [href]="e.registrationLink!" target="_blank" rel="noopener" class="action-btn action-btn-primary regist-cta mt-sm">
                        <app-icon name="external-link" [size]="15" /> Daftar Sekarang
                      </a>
                    } @else {
                      <button type="button" class="action-btn action-btn-disabled regist-cta mt-sm" disabled>
                        {{ e.status === 'past' ? 'Event Telah Selesai' : 'Pendaftaran Ditutup' }}
                      </button>
                    }
                  </aside>

                  <aside class="detail-card story-card-info">
                    <span class="eyebrow"><app-icon name="sparkles" [size]="13" /> Informasi Kegiatan</span>
                    <ul class="info-rows mt-sm">
                      @if (e.startDate) {
                        <li class="info-row">
                          <span class="info-row-icon"><app-icon name="calendar-days" [size]="14" /></span>
                          <span class="info-row-text">
                            <b>Waktu</b>
                            <span>{{ e.startDate | date: 'EEEE, d MMMM yyyy':'':'id-ID' }}{{ e.endDate && e.endDate !== e.startDate ? ' s/d ' + (e.endDate | date: 'd MMMM yyyy':'':'id-ID') : '' }}</span>
                          </span>
                        </li>
                      }
                      @if (e.location) {
                        <li class="info-row">
                          <span class="info-row-icon"><app-icon name="map-pin" [size]="14" /></span>
                          <span class="info-row-text">
                            <b>Lokasi</b>
                            <span>{{ e.location }}{{ e.place ? ' — ' + e.place : '' }}</span>
                            @if (e.locationLink) {
                              <a [href]="e.locationLink" target="_blank" rel="noopener" class="info-row-link">Buka Google Maps <app-icon name="external-link" [size]="10" /></a>
                            }
                          </span>
                        </li>
                      }
                      @if (e.tag) {
                        <li class="info-row">
                          <span class="info-row-icon"><app-icon name="tags" [size]="14" /></span>
                          <span class="info-row-text"><b>Tag</b><span>{{ e.tag }}</span></span>
                        </li>
                      }
                    </ul>

                    <a routerLink="/event" class="info-cta"><app-icon name="arrow-left" [size]="13" /> Kembali ke Event</a>
                  </aside>

                  @if (e.contactPerson1 || e.contactPerson2) {
                    <aside class="detail-card story-card-contact">
                      <span class="eyebrow"><app-icon name="whatsapp" [size]="13" /> Narahubung</span>
                      <ul class="info-rows mt-sm">
                        @if (e.contactPerson1) {
                          <li class="info-row">
                            <span class="info-row-icon"><app-icon name="whatsapp" [size]="14" /></span>
                            <span class="info-row-text">
                              @if (e.nameCp1) { <b>{{ e.nameCp1 }}</b> }
                              <a [href]="'https://wa.me/62' + e.contactPerson1" target="_blank" rel="noopener" class="info-row-link">+62 {{ e.contactPerson1 }}</a>
                            </span>
                          </li>
                        }
                        @if (e.contactPerson2) {
                          <li class="info-row">
                            <span class="info-row-icon"><app-icon name="whatsapp" [size]="14" /></span>
                            <span class="info-row-text">
                              @if (e.nameCp2) { <b>{{ e.nameCp2 }}</b> }
                              <a [href]="'https://wa.me/62' + e.contactPerson2" target="_blank" rel="noopener" class="info-row-link">+62 {{ e.contactPerson2 }}</a>
                            </span>
                          </li>
                        }
                      </ul>
                    </aside>
                  }

                  <!-- ---------- Event Lainnya — dipanggil langsung lewat
                       repo.publicList() (Observable mentah, BUKAN repo.loadPublic()
                       signal-store) supaya tidak menimpa state index, pola
                       sama persis Artikel. ---------- -->
                  @if (relatedEvents().length > 0) {
                    <aside class="detail-card story-card-related">
                      <span class="eyebrow"><app-icon name="megaphone" [size]="13" /> Event Lainnya</span>
                      <div class="related-list mt-sm">
                        @for (item of relatedEvents(); track item.eventID) {
                          <a [routerLink]="['/event', item.eventSlug]" class="related-item">
                            <div class="related-item-media">
                              @if (item.eventImage) {
                                <img [src]="thumbUrl(item.eventImage)" [alt]="item.eventTitle" loading="lazy" />
                              } @else {
                                <div class="related-item-media-fallback"><app-icon name="megaphone" [size]="16" /></div>
                              }
                            </div>
                            <div class="related-item-body">
                              <h3 class="related-item-title">{{ item.eventTitle }}</h3>
                              @if (item.startDate) {
                                <span class="related-item-date">{{ item.startDate | date: 'd MMM y':'':'id-ID' }}</span>
                              }
                            </div>
                          </a>
                        }
                      </div>
                    </aside>
                  }
                </div>
              </div>

              <section class="detail-card story-card-comments">
                <app-comment-section contentType="event" [contentID]="e.eventID" />
              </section>
            </div>
          </div>
        </main>
      } @else {
        <div class="container py-xl text-center">
          <h2>Event tidak ditemukan</h2>
          <p class="text-muted">Event yang Anda cari mungkin telah dihapus atau belum dipublikasikan.</p>
          <a routerLink="/event" class="btn btn-primary mt">Kembali ke Event</a>
        </div>
      }
    }
  `,
  styles: [`
    .crumb-row {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary);
      margin-bottom: 20px;
    }
    .crumb-link { display: inline-flex; align-items: center; gap: 5px; color: var(--color-text-secondary); text-decoration: none; transition: color var(--motion-fast) ease; }
    .crumb-link:hover { color: var(--color-primary-dark); text-decoration: none; }
    .crumb-sep { color: var(--color-border-strong); flex-shrink: 0; }
    .crumb-current {
      color: var(--color-primary-dark); font-weight: 700;
      max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    @media (max-width: 640px) {
      .crumb-row { font-size: 0.76rem; gap: 4px; margin-bottom: 14px; }
      .crumb-current { max-width: 140px; }
    }

    /* Latar gradasi + tekstur titik — pola sama Artikel/Berita/Galeri detail. */
    .hero-section {
      position: relative;
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 62%, var(--color-primary-darker) 100%);
      color: #fff;
      padding: 64px 0 56px;
      overflow: hidden;
    }
    .hero-texture {
      position: absolute; inset: 0; opacity: .5; pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,255,255,.5) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 15% -10px;
      mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 12% 15%, black, transparent 60%);
    }
    .hero-glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 65% at 88% 30%, rgba(255,196,0,.18) 0%, transparent 70%);
    }

    .hero-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: center; }
    .hero-copy { position: relative; z-index: 2; }

    .hero-badges { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 10px; margin-bottom: 16px; }
    .hero-tag {
      background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.25); color: #fff;
      font-size: .8rem; font-weight: 700; padding: 5px 12px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .hero-tag-status.status-upcoming { background: rgba(37,99,235,.4); border-color: rgba(37,99,235,.55); }
    .hero-tag-status.status-ongoing { background: rgba(5,150,105,.4); border-color: rgba(5,150,105,.55); }
    .hero-tag-status.status-past { background: rgba(107,114,128,.35); border-color: rgba(107,114,128,.5); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; flex-shrink: 0; animation: node-pulse 1.6s ease-in-out infinite; }

    .hero-event-name { display: block; font-size: 1.1rem; font-weight: 700; color: var(--color-primary-soft); letter-spacing: .03em; margin-bottom: 8px; }
    .hero-title { font-size: 2.3rem; font-weight: 900; font-family: var(--font-heading); line-height: 1.3; color: #fff; margin: 0 0 20px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }

    .hero-meta-row { display: flex; flex-wrap: wrap; gap: 16px; }
    .hero-meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: .86rem; font-weight: 600; color: rgba(255,255,255,.88); }

    .hero-badges, .hero-event-name, .hero-title, .hero-meta-row { opacity: 0; animation: heroCopyFadeUp .7s var(--ease-out) forwards; }
    .hero-badges { animation-delay: .05s; }
    .hero-event-name { animation-delay: .15s; }
    .hero-title { animation-delay: .25s; }
    .hero-meta-row { animation-delay: .4s; }
    @keyframes heroCopyFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .hero-visual { position: relative; z-index: 2; display: flex; justify-content: center; }
    .hero-cover-frame {
      position: relative; width: 100%; max-width: 420px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25);
      border-radius: 5%; padding: 10px; box-sizing: border-box; overflow: hidden;
      box-shadow: 0 24px 50px rgba(0,0,0,.35);
      opacity: 0; animation: heroCoverIn .7s var(--ease-out) .3s forwards;
    }
    @keyframes heroCoverIn { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: none; } }
    .hero-cover-img { display: block; max-width: 100%; max-height: 380px; width: auto; height: auto; object-fit: contain; border-radius: 5%; }
    .hero-cover-fallback { width: 100%; height: 220px; border-radius: 5%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.06); color: rgba(255,255,255,.6); }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; gap: 28px; }
      .hero-copy { text-align: center; }
      .hero-badges, .hero-meta-row { justify-content: center; }
      .hero-visual { order: -1; }
      .hero-cover-frame { max-width: 340px; }
    }

    /* ---------- Kanvas konten — identik .section-blob-drift Artikel/Galeri/Struktur. ---------- */
    .detail-main-section { position: relative; overflow: hidden; padding: 48px 0 80px; background: var(--color-primary-tint); }
    .detail-main-section::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 45% at 92% 0%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 72%),
        radial-gradient(ellipse 50% 45% at 4% 28%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 72%);
      opacity: .75; animation: detailBlobDrift 12s ease-in-out infinite alternate;
    }
    .detail-main-section::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom, var(--color-primary-tint) 0, rgba(243, 250, 245, 0) 70px);
    }
    .detail-main-section > .container { position: relative; z-index: 1; }
    @keyframes detailBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .detail-main-section::before { animation: none; } }

    .content-layout { max-width: 1080px; margin: 0 auto; }

    .story-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; margin-bottom: 24px; }
    .story-grid > * { min-width: 0; }
    @media (max-width: 860px) { .story-grid { grid-template-columns: 1fr; } }

    .detail-card { background: #fff; border-radius: 20px; padding: 32px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); margin-bottom: 24px; }
    .story-grid .detail-card { margin-bottom: 0; }

    .story-sidebar { display: flex; flex-direction: column; gap: 24px; }

    .story-lead-text { font-size: 1.04rem; line-height: 1.9; color: var(--color-text-secondary); }
    .content ::ng-deep p { margin: 0 0 1.2em; }
    .content ::ng-deep img { max-width: 100%; border-radius: var(--radius-md); }

    /* ---------- Tab Deskripsi/Dokumentasi — pill, bukan underline. ---------- */
    .content-tab-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .content-tab {
      display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: var(--radius-full);
      border: 1px solid var(--color-border); background: #fff; font-size: .84rem; font-weight: 700; color: var(--color-text-secondary);
      cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease, border-color var(--motion-fast) ease;
    }
    .content-tab.active {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      border-color: transparent; color: #fff; box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }
    .content-tab:hover:not(.active) { border-color: var(--color-primary); color: var(--color-primary-dark); }

    /* Transisi halus tiap ganti tab (Deskripsi/Dokumentasi) — cabang @if di
       template SUDAH dipisah per tab (lihat komentar di sana) supaya Angular
       selalu memasukkan elemen BARU ke DOM tiap ganti tab; animasi CSS di
       sini otomatis terpicu ulang setiap kali itu terjadi (beda dari
       transition biasa yang butuh perubahan properti pada elemen yang SAMA).
       Pola sama persis catalogbook.public-detail.page.ts. */
    .tab-panel { animation: tabPanelFadeIn .3s var(--ease-out); }
    @keyframes tabPanelFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .tab-panel { animation: none; } }

    /* ---------- Dokumentasi & Materi ---------- */
    .doc-links { display: flex; flex-direction: column; gap: 12px; }
    .doc-link {
      display: flex; align-items: center; gap: 14px; padding: 14px 18px; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); text-decoration: none; color: inherit; background: #fff;
      transition: box-shadow var(--motion-fast) ease, border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .doc-link:hover { box-shadow: var(--shadow); border-color: var(--color-primary); transform: translateY(-2px); text-decoration: none; }
    .doc-link-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; background: var(--color-primary-soft); color: var(--color-primary-dark); flex-shrink: 0; }
    .doc-link-body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .doc-link-body strong { font-size: .9rem; color: var(--color-text); }
    .doc-link-body span { font-size: .78rem; color: var(--color-muted); }
    .doc-link-arrow { color: var(--color-muted); flex-shrink: 0; }

    /* ---------- Share — pola CTA Artikel (.actions-row/.action-btn). ---------- */
    .actions-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--color-border); }
    .action-btn { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 22px; border-radius: var(--radius-full); font-weight: 700; font-size: .88rem; cursor: pointer; transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease, border-color var(--motion-fast) ease; text-decoration: none; border: none; }
    .action-btn-primary { color: #fff; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 38%, transparent); }
    .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary) 44%, transparent); color: #fff; }
    .action-btn-outline { border: 1px solid var(--color-border-strong); background: #fff; color: var(--color-text-secondary); }
    .action-btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary-dark); background: var(--color-primary-soft); }
    .action-btn-disabled { border: 1px solid var(--color-border-strong); background: var(--color-bg-alt); color: var(--color-muted); cursor: not-allowed; opacity: .8; }
    .copied-msg { margin: 10px 0 0; font-size: .82rem; color: var(--color-success, #16a34a); display: flex; align-items: center; gap: 5px; }

    /* ---------- Countdown ---------- */
    .story-card-countdown { text-align: center; }
    .countdown { display: flex; gap: 8px; justify-content: center; }
    .cd-unit { text-align: center; background: var(--color-primary-soft); border-radius: var(--radius-md); padding: 10px 12px; min-width: 54px; }
    .cd-val { font-size: 1.5rem; font-weight: 800; line-height: 1; color: var(--color-primary-dark); display: block; }
    .cd-lbl { font-size: .65rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-muted); margin-top: 4px; display: block; }

    /* ---------- Pendaftaran ---------- */
    .regist-deadline { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; font-size: .82rem; }
    .regist-deadline-text { color: var(--color-text-secondary); }
    .urgent-badge { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 3px 9px; border-radius: var(--radius-full); font-weight: 700; font-size: .72rem; display: inline-flex; align-items: center; gap: 4px; }
    .regist-cta { width: 100%; justify-content: center; }

    .info-rows { display: flex; flex-direction: column; gap: 14px; list-style: none; margin: 0; padding: 0; }
    .info-row { display: flex; align-items: flex-start; gap: 12px; }
    .info-row-icon {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 10px;
      background: var(--color-primary-soft); color: var(--color-primary-dark);
    }
    .info-row-text { display: flex; flex-direction: column; gap: 2px; font-size: 0.86rem; color: var(--color-text); }
    .info-row-text b { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-muted); }
    .info-row-link { margin-top: 4px; font-size: .78rem; font-weight: 700; color: var(--color-primary-dark); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
    .info-row-link:hover { text-decoration: underline; }

    .info-cta {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border);
      font-size: 0.84rem; font-weight: 700; color: var(--color-primary-dark);
      text-decoration: none;
    }
    .info-cta:hover { color: var(--color-primary); text-decoration: none; }

    .related-list { display: flex; flex-direction: column; gap: 14px; }
    .related-item {
      display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit;
      padding: 6px; margin: -6px; border-radius: 12px;
      transition: background var(--motion-fast) ease;
    }
    .related-item:hover { background: var(--color-bg-alt); text-decoration: none; }
    .related-item-media {
      position: relative; flex-shrink: 0; width: 56px; height: 56px; border-radius: 10px; overflow: hidden;
      background: var(--color-bg-alt);
    }
    .related-item-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .related-item-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); background: var(--color-primary-soft); }
    .related-item-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .related-item-title {
      margin: 0; font-size: .86rem; font-weight: 700; line-height: 1.35; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .related-item-date { font-size: .72rem; color: var(--color-muted); font-weight: 600; }
  `],
})
export class EventPublicDetailPage implements OnInit, OnDestroy {
  repo = inject(EventRepository);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  activeTab = signal<'description' | 'docs'>('description');
  copied = signal(false);
  relatedEvents = signal<Event[]>([]);

  countdown = signal({ d: 0, h: 0, m: 0, s: 0 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  isUrgent = computed(() => {
    const e = this.repo.currentEvent();
    if (!e || !e.registOpen || !e.closeRegistDate) return false;
    const diff = new Date(e.closeRegistDate).getTime() - Date.now();
    return diff > 0 && diff <= 72 * 60 * 60 * 1000;
  });

  canRegist = computed(() => {
    const e = this.repo.currentEvent();
    return !!e && e.registOpen && !!e.registrationLink;
  });

  constructor() {
    // Mulai/hentikan countdown mengikuti sinyal currentEvent — dipicu ulang
    // tiap kali data event berubah (termasuk saat pertama kali datang dari
    // loadPublicDetail(), yang resolve async setelah ngOnInit).
    effect(() => {
      const e = this.repo.currentEvent();
      this.stopCountdown();
      if (e?.status === 'upcoming' && e.startDate) {
        this.startCountdown(new Date(e.startDate));
      }
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.repo.loadPublicDetail(slug);
      this.loadRelated(slug);
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /** Dipanggil langsung lewat repo.publicList() (Observable mentah, BUKAN
   *  repo.loadPublic() signal-store) supaya tidak menimpa repo.loading()/
   *  repo.publicEvents() milik halaman index — sama pola dengan Artikel. */
  private loadRelated(currentSlug: string): void {
    this.repo.publicList({ page: 1, limit: RELATED_COUNT + 1 }).subscribe({
      next: (res) => {
        this.relatedEvents.set(res.data.filter((e) => e.eventSlug !== currentSlug).slice(0, RELATED_COUNT));
      },
      error: () => {},
    });
  }

  private startCountdown(target: Date): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.tickCountdown(target);
    this.countdownInterval = setInterval(() => this.tickCountdown(target), 1000);
  }

  private tickCountdown(target: Date): void {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      this.stopCountdown();
      this.countdown.set({ d: 0, h: 0, m: 0, s: 0 });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.countdown.set({ d, h, m, s });
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  copyUrl(): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(location.href).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  whatsappUrl(): string {
    const e = this.repo.currentEvent();
    return `https://wa.me/?text=${encodeURIComponent((e?.eventTitle ?? '') + ' ' + (isPlatformBrowser(this.platformId) ? location.href : ''))}`;
  }

  twitterUrl(): string {
    const e = this.repo.currentEvent();
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(e?.eventTitle ?? '')}&url=${encodeURIComponent(isPlatformBrowser(this.platformId) ? location.href : '')}`;
  }

  deadlineDaysLeft(): number {
    const e = this.repo.currentEvent();
    if (!e?.closeRegistDate) return 0;
    return Math.ceil((new Date(e.closeRegistDate).getTime() - Date.now()) / 86400000);
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  statusLabel(s: EventStatus): string { return EVENT_STATUS_LABEL[s] ?? s; }
  statusIcon(s: EventStatus): string { return EVENT_STATUS_ICON[s] ?? 'calendar-days'; }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  imgUrl = resolveImageUrl;
  thumbUrl = resolveThumbnailUrl;
}
