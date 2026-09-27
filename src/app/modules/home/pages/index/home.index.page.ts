import { AfterViewInit, Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../../../shared/icon.component';
import { WelcomePopupComponent } from '../../components/welcome-popup.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { PopupModalComponent } from '../../../../shared/popup-modal.component';
import { GalleryLightboxComponent } from '../../../gallery/components/gallery-lightbox/gallery-lightbox.component';
import { ContactRepository } from '../../../contact/repositories/contact.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
import { CatalogBook } from '../../../catalogbook/entities/catalog-book';
import { EventListItem } from '../../../event/entities/event';
import { Goods } from '../../../goods/entities/goods';
import { CalendarCell } from '../../../schedule/entities/schedule';
import {
  DAYS_ID_SHORT, categoryMeta as scheduleCategoryMeta,
  formatLongDate as scheduleLongDate, formatTimeRange as scheduleTimeRange,
} from '../../../schedule/schedule.constants';
import { Campaign, CampaignPublicStats } from '../../../kantong-amal/entities/campaign';
import { GalleryFeature } from '../../../gallery/entities/gallery';
import { catalogbookPath } from '../../../catalogbook/catalogbook.path';
import { eventPath } from '../../../event/event.path';
import { goodsPath } from '../../../goods/goods.path';
import { schedulePath } from '../../../schedule/schedule.path';
import { kantongAmalPath } from '../../../kantong-amal/kantong-amal.path';
import { newsPath } from '../../../news/news.path';
import { articlePath } from '../../../article/article.path';
import { statisticPath } from '../../../statistic/statistic.path';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { HomeIndexPresenter } from './home.index.presenter';
import { HomeIndexView } from './home.index.view';

interface OrgMember {
  memberName: string;
  position: string;
  level: string;
  icon: string;
}

interface MissionItem {
  no: string;
  icon: string;
  text: string;
}

/** Data ringkas untuk preview di bottom sheet mobile (lihat openPreview()) —
 *  satu bentuk generik dipakai lintas tipe kartu (berita/artikel/campaign)
 *  supaya markup sheet-nya cukup satu blok, tidak perlu cabang per tipe. */
interface CardPreviewMetaRow {
  icon: string;
  label: string;
  value: string;
}

interface CardPreview {
  chip: string;
  title: string;
  metaLines: string[];
  /** Baris meta beriabel ikon+label+nilai (mis. Penulis/Editor/Tanggal ala
   *  ldksyahid-app) — opsional, dipakai berita; artikel/campaign tetap pakai
   *  metaLines polos di atas supaya keduanya tidak perlu diubah. */
  metaRows?: CardPreviewMetaRow[];
  link: string[] | string;
  ctaLabel: string;
  progress?: { percent: number; label: string };
  image?: string | null;
  /** Ringkasan/excerpt — ala ldksyahid-app (news-sheet__excerpt), teks penuh
   *  tanpa line-clamp (beda dari excerpt di kartu teaser yang diclamp). */
  excerpt?: string | null;
  /** Warna aksen per-kartu (redesign "Karya Tulis Kita" ala ldksyahid-app —
   *  lihat articleAccent()) — override chip/ikon-meta/CTA hijau default di
   *  sheet supaya konsisten dengan warna kartu artikel yang di-tap. */
  accent?: string;
  /** Cuplikan gambar tambahan (mis. Goods.previewImages) — strip thumbnail
   *  kecil di bawah foto utama sheet, opsional, cuma dipakai kartu yang
   *  punya gallery. */
  gallery?: string[];
}

@Component({
  selector: 'app-home-index-page',
  standalone: true,
  templateUrl: './home.index.page.html',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, IconComponent, WelcomePopupComponent, BottomSheetComponent, PopupModalComponent, GalleryLightboxComponent],
  providers: [HomeIndexPresenter],
  styles: [`
    /* ---------- Kanvas: putih campur sedikit hijau (var(--color-primary-tint))
       di SEMUA section beranda — dulu putih polos (var(--color-bg)) dengan
       .section-transition sebagai satu-satunya section bertint hijau lalu
       memudar ke putih, dan .section-glow (dot-dot radial hijau menyala)
       khusus section terakhir sebelum footer. Disamakan semua supaya kanvas
       kontennya konsisten satu warna dari ujung ke ujung, dot-dot glow-nya
       dihapus (class section-glow juga sudah dilepas dari template). ---------- */
    .section { background: var(--color-primary-tint); position: relative; }
    /* ---------- Blob gradient bergerak pelan — dipakai SANGAT selektif, cuma
       di 3 section (Tentang Kami, Kantong Amal, Kontak — disebar dari awal,
       tengah, sampai akhir halaman, bukan menumpuk) supaya beranda tidak
       terasa flat statis dari ujung ke ujung tanpa mengulang .section-glow
       lama (dot-dot radial, sudah sengaja dilepas di atas demi konsistensi
       kanvas). Teknik
       & token warnanya SAMA PERSIS dengan glow di .hero::after (inset:0 +
       radial-gradient ellipse, BUKAN lingkaran ukuran tetap yang digeser
       pakai top/right negatif) — percobaan pertama pakai offset negatif
       kepotong rata oleh overflow:hidden section karena garis potongnya
       jatuh di tengah gradient yang masih pekat, bukan di bagian yang sudah
       transparan. inset:0 menghitung fade relatif terhadap kotak section itu
       sendiri jadi tidak ada seam di lingkaran-nya sendiri — TAPI titik pusat
       (at 88% 8%) ternyata masih terlalu dekat ke tepi atas section, jadi
       tepi ATAS section itu sendiri mulai dengan warna blob yang masih
       pekat, dan lompat tajam terhadap section SEBELUMNYA yang berakhir
       polos tint — makanya tetap kelihatan "kepotong" sebagai garis di
       BATAS ANTAR SECTION, bukan lagi di dalam bentuk blob-nya. Pusat
       digeser lebih ke tengah (88% 42%) supaya radiusnya sempat pudar dulu
       sebelum sampai tepi, DITAMBAH ::after meniru overlay solid-fade milik
       .hero::before — menutup ~70px pertama & terakhir section dengan warna
       tint rata supaya sambungan ke section tetangga selalu mulus apa pun
       posisi blob-nya. Dua blob (kanan & kiri) digabung sebagai dua layer
       radial-gradient dalam SATU ::before (bukan elemen terpisah — pseudo-
       element cuma ::before/::after, sudah dipakai ::after untuk fade mask)
       supaya cukup satu animasi transform yang menggerakkan keduanya
       sekaligus. Siklus dipercepat 24s→12s + jarak geser diperbesar supaya
       gerakannya lebih terasa. Cuma transform+opacity yang dianimasikan
       (bukan width/height/padding) supaya tidak memicu layout thrash. ---------- */
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    .section-blob-drift::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom,
        var(--color-primary-tint) 0, transparent 70px,
        transparent calc(100% - 70px), var(--color-primary-tint) 100%);
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) {
      .section-blob-drift::before { animation: none; }
    }

    /* padding-top diperkecil dari default .section (72px) — supaya jarak
       kosong antara kartu kutipan di hero dan heading "Tentang Kami" tidak
       terlihat seperti jeda/pemisah kosong yang lebar. */
    .section-transition { position: relative; padding-top: 32px; }

    /* ---------- Hero: dua kolom, latar hangat dua warna (hijau→emas) supaya
       viewport pertama langsung "berbunyi" energic, bukan cuma tint pucat.
       Motif geometris islami modern jadi tekstur, bukan sekadar titik. ---------- */
    /* padding-top 144px = 64px desain asli + 80px kompensasi topbar yang
       "menembus" ke sini lewat margin negatif (.pub-header.on-hero di
       site-header.component.ts) — supaya badge/heading hero sendiri tidak
       ikut ketutup header transparan yang mengambang di atasnya. */
    .hero { position: relative; background: linear-gradient(122deg, var(--color-primary-tint) 0%, var(--color-primary-soft) 58%, var(--color-gold-soft) 100%); padding: 144px 0 64px; overflow: hidden; }
    /* Overlay VERTIKAL (bukan diikat ke sudut gradient diagonal 122deg di
       atas) yang menutup 80px terakhir hero jadi rata var(--color-primary-tint)
       — sama persis dengan warna .hero-wave & stop awal .section-transition
       di bawahnya. Percobaan sebelumnya nge-tambah stop langsung di gradient
       122deg itu sendiri cacat secara geometri: posisi stop di gradient
       diagonal diukur di sepanjang GARIS gradientnya (bukan garis lurus
       horizontal), jadi sisi kanan kotak butuh jarak lebih jauh untuk sampai
       ke stop yang sama dibanding sisi kiri — makanya emas di kanan tetap
       keliatan bocor. Overlay vertikal di sini seragam di seluruh lebar pada
       ketinggian berapa pun. Tingginya disamakan dengan .hero-wave (80px)
       supaya area yang "terbuka" di lekukan wave (lihat di bawah) juga sudah
       rata tint, bukan masih menampakkan gold di baliknya. */
    .hero::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom, transparent 0, transparent calc(100% - 80px), var(--color-primary-tint) 100%);
    }
    /* Wave: solid fill di bawah kurva SVG menyatu penuh dengan overlay di
       atas (sama-sama var(--color-primary-tint)) dan dengan stop awal
       .section-transition tepat setelahnya — garis batas lurusnya digantikan
       lekukan organik supaya peralihannya tidak terbaca sebagai kotak kaku. */
    /* drop-shadow (BUKAN box-shadow) supaya bayangannya ikut bentuk lekukan
       wave, bukan kotak lurus — dy negatif melempar bayangan ke ATAS,
       menjatuhi hero di baliknya, memberi kesan "Tentang Kami" adalah lapis
       yang lebih depan/terangkat dibanding hero. Filter-nya SENGAJA di
       elemen ini (.hero-wave), TERPISAH dari overflow:hidden yang ada di
       .hero-wave-clip (anaknya) — filter + overflow:hidden di ELEMEN YANG
       SAMA bisa bikin browser gagal nge-clip dengan benar (containment jadi
       kacau saat filter aktif), muncul sebagai celah/garis putih di tepi. */
    .hero-wave { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; height: 80px; line-height: 0; pointer-events: none; filter: drop-shadow(0 -8px 14px rgba(0,0,0,.12)); }
    /* overflow:hidden di sini (bukan di .hero-wave) yang meng-clip svg 200%
       ke lebar kontainer 100% — cuma jendela geser yang kelihatan. */
    .hero-wave-clip { width: 100%; height: 100%; overflow: hidden; }
    /* svg dua kali lebar kontainer (dua periode identik, lihat komentar di
       HTML) lalu digeser translateX(-50%) — persis satu periode — supaya
       animasinya loop mulus infinite tanpa "lompatan" di titik sambungnya. */
    .hero-wave-clip svg { display: block; width: 200%; height: 80px; animation: heroWaveScroll 14s linear infinite; }
    @keyframes heroWaveScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .hero-texture {
      position: absolute; inset: 0; opacity: .7; pointer-events: none;
      background-image: radial-gradient(circle, var(--color-primary-soft) 1.5px, transparent 1.6px);
      background-size: 26px 26px; background-position: 80% -10px;
      mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
      -webkit-mask-image: radial-gradient(circle at 85% 15%, black, transparent 60%);
    }
    /* Glow ambient satu ini menggantikan .hero-network::before yang lama —
       dipindah jadi lapisan penuh se-hero (bukan terkurung kotak
       .hero-network yang overflow:hidden) supaya warnanya benar-benar
       menyatu ke gradient .hero sendiri, bukan terlihat "kepotong" di tepi
       kotak grafik jaringan. */
    .hero::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 60% 70% at 78% 60%, var(--color-gold-soft) 0%, var(--color-primary-soft) 40%, transparent 75%);
      opacity: .9;
    }
    .hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1.25fr; gap: 32px; align-items: center; }
    /* hero-copy diberi stacking context sendiri di atas grafik jaringan —
       cegah teks tertutup bila grafik/glow di kolom sebelah melebar. */
    .hero-copy { position: relative; z-index: 2; }
    /* Entrance staggered: badge → judul → paragraf muncul berurutan (bukan
       langsung semua sekaligus) — opacity+translateY satu arah, GPU-friendly,
       masing-masing delay .12s lebih lambat dari elemen sebelumnya. */
    .hero-badge, .hero-title, .hero-sub { opacity: 0; animation: heroFadeUp .7s var(--ease-out) forwards; }
    .hero-badge { animation-delay: .05s; }
    .hero-title { animation-delay: .2s; }
    .hero-sub { animation-delay: .35s; }
    @keyframes heroFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .hero-badge { display: inline-flex; align-items: center; gap: 9px; background: #fff; border: 1px solid var(--color-gold); color: var(--color-gold-dark); padding: 8px 18px; border-radius: var(--radius-full); font-weight: 700; font-size: .85rem; margin-bottom: 24px; box-shadow: var(--shadow-sm); }
    .hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; animation: node-pulse 2.4s ease-in-out infinite; }
    .hero-title { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -.01em; max-width: 16ch; line-height: 1.12; }
    .hero-title-accent { font-family: var(--font-accent); font-style: italic; font-weight: 600; color: var(--color-primary-dark); }
    .hero-sub { max-width: 46ch; font-size: 1.05rem; color: var(--color-text-secondary); }

    /* ---------- Visual hero "Peta Silaturahmi Nusantara": siluet kepulauan
       Indonesia sungguhan (bukan lagi diagram jaringan abstrak) — Puskomnas
       ditandai persis di Jawa (Yogyakarta, 1986), simpul daerah/LDK tersebar
       di tiap pulau, garis menyala menunjukkan koordinasi yang aktif. Aspek
       rasio svg sengaja lebar (640:240) mengikuti bentang timur-barat
       Nusantara yang sesungguhnya, bukan kotak persegi. ---------- */
    .hero-network { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
    /* .hero-map: pembungkus svg saja (bukan .hero-network yang juga memuat
       kartu kutipan) — jadi acuan posisi % .network-tooltip persis pas di
       atas svg, tidak ikut bergeser oleh tinggi kartu di bawahnya. */
    .hero-map { position: relative; width: 100%; }
    .hero-network-svg { position: relative; z-index: 1; width: 100%; height: 300px; overflow: visible; }
    .island-silhouette { fill: url(#islandFill); stroke: var(--color-primary-bright); stroke-width: 1.3; stroke-linejoin: round; opacity: .95; filter: drop-shadow(0 6px 14px rgba(0,147,59,.22)); }
    /* Garis+simpul jaringan baru muncul (fade-in) setelah siluet peta selesai
       "digambar sendiri" (animateIslandPath(), durasi 2.2s) — delay .8s
       dipilih supaya overlap sedikit dengan ekor animasi gambar, bukan
       menunggu sampai benar-benar selesai (terasa lebih menyatu). */
    .network-overlay { opacity: 0; animation: heroFadeUp .6s ease-out .9s forwards; }
    /* Tooltip custom pengganti <title> bawaan browser — kartu putih kecil
       dengan anak panah, muncul tepat di atas simpul yang di-hover (posisi
       dari leftPct/topPct di heroMapNodes, dihitung dari cx/cy yang sama
       dengan svg jadi presisi). pointer-events:none supaya tidak mengganggu
       mouseleave saat kursor bergerak menuju tooltip. */
    .network-tooltip {
      position: absolute; transform: translate(-50%, calc(-100% - 14px)); z-index: 10; pointer-events: none;
      background: #fff; color: var(--color-text); font-family: var(--font-body); font-size: .78rem; font-weight: 700;
      white-space: nowrap; padding: 7px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg); animation: tooltipPop .16s var(--ease-out);
    }
    .network-tooltip::before, .network-tooltip::after {
      content: ''; position: absolute; left: 50%; transform: translateX(-50%); border: 7px solid transparent;
    }
    .network-tooltip::before { top: 100%; border-top-color: var(--color-border); }
    .network-tooltip::after { top: calc(100% - 1px); border-width: 6px; border-top-color: #fff; }
    @keyframes tooltipPop { from { opacity: 0; transform: translate(-50%, calc(-100% - 8px)) scale(.92); } to { opacity: 1; transform: translate(-50%, calc(-100% - 14px)) scale(1); } }
    /* Kartu kutipan Al-Qur'an/Hadits di bawah peta — dokumen-flow biasa
       (bukan lagi position:absolute) supaya section .hero ikut menyesuaikan
       tingginya terhadap panjang kutipan yang sedang tampil (lihat
       heroQuotes/quoteIndex di home.index.page.ts — dipilih acak sekali per
       pemuatan halaman, jadi tidak ada perubahan tinggi mendadak setelah itu). */
    .hero-network-caption {
      display: flex; align-items: flex-start; gap: 10px; width: 100%; max-width: 480px;
      margin: 0; padding: 14px 16px; background: rgba(255,255,255,.92); backdrop-filter: blur(6px);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      opacity: 0; animation: heroFadeUp .6s var(--ease-out) 1.3s forwards;
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    /* Efek angkat saat hover — cuma di perangkat yang benar-benar punya mouse
       (hover:hover + pointer:fine), supaya tidak "nyangkut" di layar sentuh
       saat gestur scroll melewati kartu ini (lihat catatan yang sama di
       site-header.component.ts untuk masalah serupa). */
    @media (hover: hover) and (pointer: fine) {
      .hero-network-caption:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,.14); }
    }
    .hero-network-caption-dot {
      flex-shrink: 0; width: 9px; height: 9px; border-radius: 50%; margin-top: 5px;
      background: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft);
    }
    .hero-network-caption-body { min-width: 0; flex: 1; }
    /* font-body polos (bukan font-accent italic) + warna secondary yang lebih
       lembut — versi italic sebelumnya kurang nyaman dibaca. Teks selalu
       ditampilkan penuh — tanpa lihat selengkapnya/hitung mundur/tombol
       tutup — kutipan hanya berganti saat halaman dimuat ulang (lihat
       heroQuotes/quoteIndex di home.index.page.ts). */
    .hero-network-caption-text {
      margin: 0; font-family: var(--font-body); font-size: .88rem; line-height: 1.6;
      color: var(--color-text-secondary);
    }
    .hero-network-caption-source { display: block; margin-top: 8px; font-style: normal; font-size: .74rem; font-weight: 700; color: var(--color-primary-dark); }

    /* ---------- Statistik Jaringan Nasional — ringkasan angka jaringan
       LDK/Puskomda/Puskomnas + satu chart, versi ringkas dari halaman penuh
       /tentang/statistik-jaringan (link "Lihat Selengkapnya" di bawahnya). ---------- */
    .network-stats-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 36px; }
    .network-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; }
    .network-stat-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .network-stat-tile { background: var(--color-bg-warm); border-radius: var(--radius-md); padding: 20px; text-align: center; }
    .network-stat-tile b { display: block; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--color-primary-dark); }
    .network-stat-tile span { font-size: .82rem; color: var(--color-text-secondary); font-weight: 600; }
    .network-chart-wrap { position: relative; height: 260px; }
    .network-stats-more { text-align: center; margin-top: 28px; }
    @media (max-width: 900px) { .network-stats-grid { grid-template-columns: 1fr; } }

    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { position: relative; aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.15rem; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 0; }

    /* ---------- Berita: carousel intro-panel + track bergeser — mengikuti
       referensi "Berita Terbaru" ala Kemenkeu (panel warna solid statis di
       kiri + kartu bergeser dengan panah bulat di tepi), diadaptasi ke
       palet hijau brand. Beda bentuk dari Artikel di bawahnya (grid kartu
       teks) supaya kedua section terasa punya identitas visual sendiri. ---------- */
    /* Elemen ini SENGAJA dirender di luar .container (lihat template) supaya
       sisi kanan benar-benar mentok tepi viewport tanpa trik negative-margin
       vw (gampang meleset beberapa px & rawan scrollbar overflow). Sisi kiri
       disejajarkan manual ke titik yang sama dengan konten .container lewat
       margin-left terhitung (BUKAN padding — padding cuma menggeser konten,
       bukan kotak bayangan/border-radius-nya): max(20px, ...) menjaga gutter
       minimum 20px (sama seperti .container) begitu viewport lebih sempit
       dari 1180px.
       Sudut kanan SENGAJA persegi (bukan var(--radius-lg) di semua sisi) —
       melengkung di tepi yang mentok layar bakal terlihat aneh. Shadow
       ditebalkan (dua lapis, bukan --shadow-lg saja) supaya section ini
       terasa "mengambang" lebih jelas dari kanvas halaman. */
    .berita-carousel {
      display: flex; border-radius: var(--radius-lg) 0 0 var(--radius-lg); overflow: hidden;
      box-shadow: 0 10px 24px rgba(6,26,15,.14), 0 2px 8px rgba(6,26,15,.08);
      margin-left: max(20px, calc((100vw - 1140px) / 2));
    }
    /* Panel solid hijau (bukan gradient) + siluet ikon koran raksasa transparan
       di sudut — dipotong oleh overflow:hidden di panel ini sendiri, BUKAN
       .berita-carousel (supaya tidak ikut memotong bayangan kartu di
       sebelahnya). Padding vertikal sengaja lebih besar dari tinggi alami
       kartu foto supaya panelnya terlihat lebih tinggi dari track kartu di
       sampingnya — align-items:stretch bawaan flex bikin track-wrap ikut
       setinggi panel, kartu fotonya sendiri dipusatkan vertikal di situ
       (lihat align-items:center di .berita-carousel-track). */
    .berita-carousel-intro {
      position: relative; overflow: hidden;
      flex: 0 0 420px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding: 96px 26px; text-align: center; color: #fff; background: var(--color-primary);
    }
    .berita-carousel-silhouette {
      position: absolute; right: -34px; bottom: -34px; z-index: 0; color: rgba(255,255,255,.14);
      transform: rotate(-12deg); pointer-events: none;
    }
    /* Siluet kedua, lebih kecil, sudut berlawanan — menambah tekstur tanpa
       mengganggu blok teks (tetap z-index:0, di bawah .berita-carousel-icon/
       p/cta yang punya z-index:1). */
    .berita-carousel-silhouette-2 {
      position: absolute; left: -18px; top: -18px; z-index: 0; color: rgba(255,255,255,.10);
      transform: rotate(18deg); pointer-events: none;
    }
    /* max-width lebih sempit dari panel (420px) + margin-right — sengaja
       menggeser blok teks/tombol ke kiri, menyisakan "zona aman" hijau
       polos di kanan supaya kartu pertama tetap bisa menumpuk/"menabrak"
       tepi panel (lihat .berita-carousel-track-wrap) TANPA menutupi teks. */
    .berita-carousel-icon, .berita-carousel-intro p, .berita-carousel-cta {
      position: relative; z-index: 1; max-width: 150px; margin-right: 218px;
    }
    .berita-carousel-icon { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.16); }
    .berita-carousel-intro p { margin-block: 0; font-size: .88rem; line-height: 1.6; opacity: .92; }
    .berita-carousel-cta {
      display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid rgba(255,255,255,.7);
      color: #fff; padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 700; font-size: .76rem;
      letter-spacing: .04em; text-transform: uppercase;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .berita-carousel-cta:hover { background: #fff; color: var(--color-primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-lg); text-decoration: none; }
    /* Overlap "menabrak" tepi panel hijau — blok teks/tombol di panel sudah
       digeser ke kiri (lihat max-width+margin-right di atas) supaya ini aman
       jatuh di zona hijau kosong, bukan di atas teks. padding-left track
       DIHAPUS (bukan cuma dikurangi) supaya kartu pertama benar-benar mulai
       tepat di tepi track-wrap yang digeser -230px — sebelumnya padding:20px
       "memakan" sebagian besar overlap sehingga yang kelihatan cuma kotak
       putih background, bukan foto kartunya sendiri. background TRANSPARENT
       (bukan #fff) supaya di zona overlap yang menumpuk ke panel adalah
       benar-benar kartu foto di atas HIJAU (bukan kartu foto di atas kotak
       putih tak kasat mata yang kebetulan berdiri di depan hijau) — tanpa
       ini efeknya cuma kelihatan "panel hijau lebih pendek", bukan "kartu
       menimpa panel". */
    .berita-carousel-track-wrap { position: relative; z-index: 2; flex: 1; min-width: 0; margin-left: -230px; background: transparent; }
    .berita-carousel-track {
      display: flex; align-items: center; gap: 18px; overflow-x: auto; height: 100%; padding: 20px 20px 20px 0; scroll-behavior: smooth;
      scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch;
    }
    .berita-carousel-track::-webkit-scrollbar { display: none; }
    /* Panah navigasi — geser track (scrollNews() di .ts) alih-alih anchor
       biasa, supaya bisa dipakai berulang tanpa perlu scroll native tiap
       kartu; disembunyikan di mobile (breakpoint di bawah), swipe native
       cukup di sana, pola sama seperti .card-scroller section lain. */
    .berita-carousel-arrow {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 3;
      width: 40px; height: 40px; border-radius: 50%; border: none; background: #fff; box-shadow: var(--shadow-lg);
      display: grid; place-items: center; color: var(--color-primary-dark); cursor: pointer;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .berita-carousel-arrow:hover { background: var(--color-primary); color: #fff; transform: translateY(-50%) scale(1.08); }
    .berita-carousel-arrow.prev { left: 10px; }
    .berita-carousel-arrow.next { right: 10px; }
    /* Kartu foto full-bleed + scrim gelap + judul/meta di atas foto (bukan
       lagi thumbnail + body putih terpisah) — mengikuti referensi Berita
       Terbaru kemenkeu.go.id: hari, tanggal, dan jam tampil sebagai teks
       putih di atas foto, dipisah titik kuning kecil (--color-gold), bukan
       lagi disembunyikan di kartu. Dibesarkan lagi (340px) supaya cuma ~3
       kartu yang kelihatan penuh dalam satu layar (bukan 4), sisanya
       "nyempil"/kepotong di kanan sebagai penanda masih bisa digeser. */
    .news-carousel-card {
      flex: 0 0 340px; scroll-snap-align: start; display: block; border-radius: var(--radius-md);
      overflow: hidden; box-shadow: none;
      transition: transform var(--motion-base) var(--ease-out), box-shadow var(--motion-base) ease;
    }
    @media (hover: hover) and (pointer: fine) {
      .news-carousel-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); text-decoration: none; }
      .news-carousel-card:hover .news-carousel-media img { transform: scale(1.08); }
    }
    .news-carousel-media { position: relative; aspect-ratio: 3 / 4; background: var(--color-primary-soft); overflow: hidden; }
    .news-carousel-media img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--motion-slow) ease; }
    .news-carousel-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .75rem; letter-spacing: .08em; }
    .news-carousel-scrim {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(0deg, rgba(6,26,15,.92) 0%, rgba(6,26,15,.55) 40%, transparent 72%);
    }
    .news-carousel-overlay { position: absolute; left: 0; right: 0; bottom: 0; padding: 22px 20px; color: #fff; }
    /* color:#fff eksplisit — h1..h5 global (styles.scss) menimpa warna
       putih yang harusnya diwarisi dari .news-carousel-overlay, karena aturan
       elemen langsung selalu menang atas inheritance. */
    .news-carousel-overlay h4 { margin: 0 0 14px; font-size: 1.2rem; font-weight: 700; line-height: 1.4; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    /* Baris meta dibesarkan + diberi bobot medium (dulu terlalu kecil/tipis,
       "kalimat di bawah" yang dikeluhkan) — titik kuning ikut dibesarkan
       proporsional supaya tetap jadi separator yang jelas, bukan noktah. */
    .news-carousel-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: .92rem; font-weight: 500; opacity: .95; }
    .news-carousel-meta-dot { display: inline-flex; align-items: center; gap: 7px; }
    .news-carousel-meta-dot span { width: 5px; height: 5px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; }
    @media (max-width: 720px) {
      /* Di mobile TIDAK mentok kanan (beda dari desktop) — konsisten dengan
         .card-scroller section lain yang tetap respect gutter .container di
         kedua sisi; efek "kepotong sampai tepi layar" murni ide desktop. */
      .berita-carousel { flex-direction: column; border-radius: var(--radius-lg); margin-right: 20px; }
      .berita-carousel-intro { flex: none; padding: 24px 20px; }
      .berita-carousel-icon, .berita-carousel-intro p, .berita-carousel-cta { max-width: none; margin-right: 0; }
      .berita-carousel-arrow { display: none; }
      /* Inset kiri/kanan dipindah KE SINI (wrapper statis, BUKAN elemen yang
         overflow-x:auto di bawahnya) — sudah dicoba lewat padding
         .berita-carousel-track maupun margin di kartu pertama/terakhir,
         dua-duanya tidak pernah kepakai: scroll-snap-type:mandatory di
         Chromium TERUS-MENERUS mengoreksi scrollLeft (bukan cuma sekali pas
         render) supaya box kartu snap PERTAMA rata pas di awal scrollport —
         ini berlaku untuk *apapun* yang menggeser kartu itu sendiri
         (padding container, margin kartu, bahkan elemen spacer di dalam
         track), karena semuanya masih bagian dari koordinat scroll yang
         sama. Satu-satunya inset yang selamat dari koreksi itu adalah yang
         duduk di LUAR elemen scroll — wrapper ini cuma position:relative
         (bukan overflow-x:auto), jadi paddingnya murni statis, tidak pernah
         disentuh mekanisme snap sama sekali. */
      .berita-carousel-track-wrap { margin-left: 0; background: #fff; padding: 0 14px; }
      .berita-carousel-track { padding: 14px 0; }
      .news-carousel-card { flex: 0 0 88%; }
      .news-carousel-media { aspect-ratio: 4 / 5; }
    }

    /* ---------- Perpustakaan: mirror horizontal PERSIS dari .berita-carousel
       di atas — sama semuanya (panel solid + overlap + panah + kartu foto
       full-bleed), cuma DOM dan setiap properti kiri/kanan dibalik: panel
       hijau di KANAN, kartu bleed ke tepi KIRI viewport (kebalikan Berita
       yang bleed kanan). Kartu/media/scrim/overlay/meta pakai ULANG
       .news-carousel-card & kerabatnya langsung tanpa modifikasi — semua
       simetris (tidak ada left/right), jadi tidak perlu versi cermin
       sendiri. Hanya shell (panel+track-wrap+panah) yang genuinely beda. ---------- */
    .pustaka-carousel {
      display: flex; border-radius: 0 var(--radius-lg) var(--radius-lg) 0; overflow: hidden;
      box-shadow: 0 10px 24px rgba(6,26,15,.14), 0 2px 8px rgba(6,26,15,.08);
      margin-right: max(20px, calc((100vw - 1140px) / 2));
    }
    .pustaka-carousel-intro {
      position: relative; overflow: hidden;
      flex: 0 0 420px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding: 96px 26px; text-align: center; color: #fff; background: var(--color-primary);
    }
    .pustaka-carousel-silhouette {
      position: absolute; left: -34px; bottom: -34px; z-index: 0; color: rgba(255,255,255,.14);
      transform: rotate(12deg); pointer-events: none;
    }
    /* Siluet kedua, lebih kecil, sudut berlawanan — mirror .berita-carousel-
       silhouette-2, konsisten menambah tekstur di panel kanan ini juga. */
    .pustaka-carousel-silhouette-2 {
      position: absolute; right: -18px; top: -18px; z-index: 0; color: rgba(255,255,255,.10);
      transform: rotate(-18deg); pointer-events: none;
    }
    /* margin-LEFT (bukan margin-right seperti Berita) — zona aman hijau
       polos sekarang ada di KIRI panel (sisi yang ditumpuk kartu terakhir),
       jadi teks/tombol digeser ke KANAN. */
    .pustaka-carousel-icon, .pustaka-carousel-intro p, .pustaka-carousel-cta {
      position: relative; z-index: 1; max-width: 150px; margin-left: 218px;
    }
    .pustaka-carousel-icon { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.16); }
    .pustaka-carousel-intro p { margin-block: 0; font-size: .88rem; line-height: 1.6; opacity: .92; }
    .pustaka-carousel-cta {
      display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid rgba(255,255,255,.7);
      color: #fff; padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 700; font-size: .76rem;
      letter-spacing: .04em; text-transform: uppercase;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .pustaka-carousel-cta:hover { background: #fff; color: var(--color-primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-lg); text-decoration: none; }
    /* margin-RIGHT negatif (bukan margin-left seperti Berita) — track-wrap
       mendahului panel di DOM, jadi untuk menumpuk kartu TERAKHIR ke tepi
       KIRI panel, track-wrap-nya sendiri yang "diperpanjang" ke kanan
       menembus wilayah panel (bukan panel yang ditarik ke kiri). */
    .pustaka-carousel-track-wrap { position: relative; z-index: 2; flex: 1; min-width: 0; margin-right: -230px; background: transparent; }
    .pustaka-carousel-track {
      display: flex; align-items: center; gap: 18px; overflow-x: auto; height: 100%; padding: 20px 0 20px 20px; scroll-behavior: smooth;
      scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch;
    }
    .pustaka-carousel-track::-webkit-scrollbar { display: none; }
    .pustaka-carousel-arrow {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 3;
      width: 40px; height: 40px; border-radius: 50%; border: none; background: #fff; box-shadow: var(--shadow-lg);
      display: grid; place-items: center; color: var(--color-primary-dark); cursor: pointer;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .pustaka-carousel-arrow:hover { background: var(--color-primary); color: #fff; transform: translateY(-50%) scale(1.08); }
    .pustaka-carousel-arrow.prev { left: 10px; }
    .pustaka-carousel-arrow.next { right: 10px; }
    @media (max-width: 720px) {
      .pustaka-carousel { flex-direction: column; border-radius: var(--radius-lg); margin-left: 20px; }
      .pustaka-carousel-intro { flex: none; padding: 24px 20px; }
      .pustaka-carousel-icon, .pustaka-carousel-intro p, .pustaka-carousel-cta { max-width: none; margin-left: 0; }
      .pustaka-carousel-arrow { display: none; }
      /* Inset statis di wrapper (bukan di track yang overflow-x:auto) sejak
         awal — lihat catatan panjang di .berita-carousel-track-wrap mobile
         soal kenapa padding/margin di DALAM elemen scroll selalu dibatalkan
         oleh scroll-snap-type:mandatory. */
      .pustaka-carousel-track-wrap { margin-right: 0; background: #fff; padding: 0 14px; }
      .pustaka-carousel-track { padding: 14px 0; }
    }

    /* ---------- Artikel: redesign "Karya Tulis Kita" ala ldksyahid-app —
       header-nya SENGAJA dikembalikan ke pola eyebrow+h2 polos yang sama
       dipakai section lain (Berita/Pustaka/Event/dst), cuma layoutnya yang
       beda (heading+subtitle kiri, "Lihat Semua" sejajar di kanan, bukan
       di bawah grid) — badge pill+heading berwarna+sparkle ala referensi
       dicoba lalu di-drop lagi karena tidak konsisten dengan gaya heading
       section lain di halaman ini. Kartu foto full-bleed (media/scrim/
       overlay pakai ULANG .news-carousel-media dkk, sama seperti Berita/
       Pustaka) + badge tanggal ala Event tetap dipertahankan, ditutup chip
       kategori/judul/Penulis-Editor/CTA yang semuanya mengikuti SATU warna
       aksen per-kartu (--card-accent, 3 warna bergilir — lihat
       articleAccent() di .ts) via color-mix(), bukan lagi batang emas
       tunggal seperti sebelumnya. ---------- */
    .artikel-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
    .artikel-subtitle { margin: 8px 0 0; color: var(--color-text-secondary); font-size: 1rem; max-width: 46ch; }
    /* Pil gradient hijau brand, border-radius+teknik hover disamakan PERSIS
       dengan .account-chip navbar (site-header.component.ts): radius
       var(--radius-sm) (diwarisi .btn-sm di sana, bukan var(--radius-full)
       seperti CTA gradient lain), dan swap gradient hover lewat ::before
       terpisah yang di-crossfade via opacity — background-image (gradient)
       tidak bisa ditransisikan mulus (properti "discrete"), jadi gradient
       hover-nya loncat instan kalau ditransisi langsung di background. */
    .artikel-btn-all {
      position: relative; flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff;
      padding: 8px 14px; border-radius: var(--radius-sm); font-weight: 700; font-size: .85rem;
      box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary-dark) 32%, transparent);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .artikel-btn-all::before {
      content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      opacity: 0; transition: opacity var(--motion-fast) ease;
    }
    .artikel-btn-all app-icon { transition: transform var(--motion-fast) ease; }
    .artikel-btn-all:hover {
      transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary-dark) 42%, transparent); text-decoration: none; color: #fff;
    }
    .artikel-btn-all:hover::before { opacity: 1; }
    .artikel-btn-all:hover app-icon { transform: translateX(4px); }
    @media (prefers-reduced-motion: reduce) { .artikel-btn-all::before { transition: none; } }

    .artikel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
    /* .reveal (scroll entrance animation) DIPINDAH ke wrapper ini, TERPISAH
       dari .artikel-card — .reveal pakai animation-timeline:view() yang
       terus-menerus "memegang" properti transform (reveal-in keyframe:
       translateY(16px)->0, fill:both). CSS Animations menang atas normal
       author rule di cascade TERLEPAS dari specificity/:hover, jadi kalau
       .reveal dan hover-transform ada di ELEMEN YANG SAMA, transform hover
       tidak akan pernah benar-benar berjalan smooth — sekalipun dipaksa
       !important (menang di nilai akhir), TRANSISI-nya tetap gagal jalan
       karena transition disuppress selama propertinya masih "dimiliki"
       animasi aktif (dibuktikan: matrix hover instan tanpa interpolasi sama
       sekali di getComputedStyle, walau sudah !important). Wrapper ini
       murni utilitas layout (mengambil alih sizing grid/flex dari
       .artikel-card, lihat @media mobile di bawah) supaya .artikel-card
       sendiri bebas transform tanpa kompetisi. */
    .artikel-card-wrap { height: 100%; }
    .artikel-card {
      --card-accent: var(--color-gold-dark);
      position: relative; height: 100%; display: flex; flex-direction: column; background: #fff;
      border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(6,26,15,.06);
      transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    .artikel-card:hover {
      transform: translateY(-6px) scale(1.03); text-decoration: none;
      box-shadow: 0 20px 40px rgba(6,26,15,.08), 0 4px 20px color-mix(in srgb, var(--card-accent) 25%, transparent);
    }
    .artikel-card-media { aspect-ratio: 4 / 5; }
    /* Badge tanggal — pola sama seperti .event-date-badge, ditempel di kartu
       artikel alih-alih di kartu event. */
    .artikel-card-date {
      position: absolute; top: 12px; left: 12px; z-index: 1; background: rgba(255,255,255,.95);
      border-radius: 14px; padding: 6px 11px; text-align: center; line-height: 1; box-shadow: var(--shadow-sm);
      transition: transform var(--motion-fast) var(--ease-out);
    }
    .artikel-card:hover .artikel-card-date { transform: rotate(-3deg) scale(1.05); }
    .artikel-card-date-num { display: block; font-size: 1.05rem; font-weight: 800; color: var(--card-accent); }
    .artikel-card-date-month { display: block; font-size: .6rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; letter-spacing: .04em; }
    .artikel-card-body { padding: 18px 20px 20px; flex: 1; display: flex; flex-direction: column; }
    .artikel-chip {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px;
      background: color-mix(in srgb, var(--card-accent) 12%, white); color: var(--card-accent);
      padding: 5px 14px 5px 10px; border-radius: 10px; font-size: .72rem; font-weight: 700; letter-spacing: .02em;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .artikel-chip::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--card-accent); flex-shrink: 0; }
    .artikel-card:hover .artikel-chip { background: var(--card-accent); color: #fff; }
    .artikel-card:hover .artikel-chip::before { background: #fff; }
    .artikel-card-title {
      margin: 0 0 14px; font-size: .98rem; line-height: 1.45; font-weight: 700; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      background-image: linear-gradient(var(--card-accent), var(--card-accent)); background-size: 0 2px; background-repeat: no-repeat; background-position: left bottom;
      transition: background-size var(--motion-fast) ease, color var(--motion-fast) ease; padding-bottom: 2px; flex: 1;
    }
    .artikel-card:hover .artikel-card-title { background-size: 100% 2px; color: var(--card-accent); }
    .artikel-people {
      display: flex; flex-direction: column; background: color-mix(in srgb, var(--card-accent) 5%, var(--color-bg-alt));
      border-radius: 14px; padding: 11px 13px; margin-bottom: 14px;
    }
    .artikel-people-row { display: flex; align-items: center; gap: 9px; min-width: 0; }
    .artikel-people-divider { height: 1px; background: color-mix(in srgb, var(--card-accent) 14%, transparent); margin: 8px 0; border-radius: 1px; }
    .artikel-avatar {
      flex-shrink: 0; width: 27px; height: 27px; border-radius: 9px; display: grid; place-items: center;
      background: color-mix(in srgb, var(--card-accent) 16%, white); color: var(--card-accent);
    }
    .artikel-people-info { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
    .artikel-people-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .artikel-people-name { font-size: .82rem; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .artikel-card-cta {
      display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: auto;
      color: var(--card-accent); background: color-mix(in srgb, var(--card-accent) 8%, transparent);
      font-weight: 700; font-size: .82rem; padding: 10px 18px; border-radius: 14px;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .artikel-card-cta app-icon { transition: transform var(--motion-fast) ease; }
    .artikel-card:hover .artikel-card-cta { background: var(--card-accent); color: #fff; }
    .artikel-card:hover .artikel-card-cta app-icon { transform: translateX(4px); }
    @media (max-width: 900px) { .artikel-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 720px) {
      .artikel-head { flex-direction: column; }
      .artikel-btn-all { align-self: stretch; justify-content: center; }
      /* Carousel horizontal scroll-snap di mobile (bukan grid stack) —
         konsisten dengan pola .card-scroller section lain, kartu kajian
         sekarang cukup berat (foto+chip+people+CTA) untuk pantas discroll
         alih-alih ditumpuk vertikal penuh. */
      .artikel-grid { display: flex; grid-template-columns: none; overflow-x: auto; gap: 16px; padding: 4px 4px 12px; scroll-snap-type: x mandatory; scrollbar-width: none; }
      .artikel-grid::-webkit-scrollbar { display: none; }
      .artikel-card-wrap { flex: 0 0 84%; scroll-snap-align: start; }
    }

    /* ---------- Book card: siluet rak buku (thumb potret, bukan 16:10 seperti
       kartu berita), rating disematkan sebagai ribbon di sudut sampul. ---------- */
    .book-thumb { aspect-ratio: 3/4; }
    .book-fav {
      position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px;
      background: rgba(255,255,255,.92); color: var(--color-text); font-size: .74rem; font-weight: 700;
      padding: 4px 9px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }
    .book-fav app-icon { color: #e0455f; }
    /* Jumlah halaman — data (b.pages) yang tadinya tidak dipakai di kartu
       ringkas beranda, memperkuat kesan "sampul buku" bersama book-fav. */
    .book-pages {
      position: absolute; left: 10px; bottom: 10px; background: rgba(22,33,28,.68); color: #fff;
      font-size: .72rem; font-weight: 700; padding: 4px 9px; border-radius: var(--radius-full);
    }

    /* ---------- Agenda & Kegiatan: heading eyebrow+h2 dikembalikan polos di
       LUAR panel (center, di atas — konsisten dengan heading section lain),
       panel hijau full-width di bawahnya membungkus ikon+deskripsi+CTA pill
       ("Lihat Semua Event", gayanya SENGAJA identik dengan
       .pustaka-carousel-cta / Koleksi Buku Digital) SEKALIGUS grid kartu
       event — kartu "duduk" di dalam panel (bukan section terpisah di
       bawahnya), makanya padding dipecah dua wrapper (-intro untuk teks,
       -cards untuk grid) alih-alih satu padding di .agenda-panel sendiri. ---------- */
    .agenda-panel {
      position: relative; overflow: hidden; margin-bottom: 40px;
      background: var(--color-primary); color: #fff; border-radius: var(--radius-lg);
      box-shadow: 0 10px 24px rgba(6,26,15,.14), 0 2px 8px rgba(6,26,15,.08);
    }
    .agenda-panel-intro {
      position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center;
      gap: 12px; text-align: center; padding: 40px 24px 28px;
    }
    /* Siluet dipindah jadi ANAK .agenda-panel-intro (dulu sibling-nya, child
       langsung .agenda-panel) — panel ini sekarang membungkus grid kartu
       juga (lihat .agenda-panel-cards di bawah), jadi kalau posisinya masih
       relatif ke .agenda-panel yang tinggi penuh, "bottom:-30px" jatuh di
       balik baris kartu terakhir dan nyaris tak kelihatan. Di dalam intro
       (pendek, cuma area teks), posisinya selalu tetap terlihat di sekitar
       teks. z-index NEGATIF (bukan 0 seperti Berita/Pustaka) karena
       .agenda-panel-icon/p/cta di sini TIDAK diberi z-index:1 eksplisit —
       negatif memastikan siluet tetap di belakang konten in-flow tanpa
       perlu mengubah elemen lain. */
    .agenda-panel-silhouette {
      position: absolute; right: -30px; bottom: -30px; z-index: -1; color: rgba(255,255,255,.14);
      transform: rotate(-12deg); pointer-events: none;
    }
    .agenda-panel-silhouette-2 {
      position: absolute; left: -16px; top: -16px; z-index: -1; color: rgba(255,255,255,.10);
      transform: rotate(16deg); pointer-events: none;
    }
    .agenda-panel-icon { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.16); }
    .agenda-panel-intro p { max-width: 540px; margin: 0; font-size: .92rem; line-height: 1.65; opacity: .92; }
    .agenda-panel-cta {
      display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid rgba(255,255,255,.7);
      color: #fff; padding: 10px 22px; border-radius: var(--radius-sm); font-weight: 700; font-size: .76rem;
      letter-spacing: .04em; text-transform: uppercase; margin-top: 2px;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .agenda-panel-cta:hover { background: #fff; color: var(--color-primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-lg); text-decoration: none; }
    /* Grid kartu di DALAM panel — .card-scroller (grid 3 kolom/geser mobile)
       dipakai apa adanya. Inset horizontal SENGAJA dipecah dua: wrapper
       statis (.agenda-panel-cards-wrap) yang pegang padding kiri/kanan +
       z-index, .card-scroller sendiri cuma padding atas/bawah. Di mobile,
       .card-scroller jadi elemen yang overflow-x:auto+scroll-snap — padding
       kiri/kanan DI ELEMEN YANG SCROLL ITU SENDIRI selalu dikoreksi/
       dihapus browser (scroll-snap-type:mandatory terus membetulkan
       scrollLeft supaya kartu snap PERTAMA rata pas di awal scrollport),
       persis masalah yang sama seperti .berita-carousel-track-wrap —
       makanya inset kiri/kanan mobile-nya dipindah ke wrapper yang statis
       (tidak ikut scroll), bukan ke .card-scroller. */
    .agenda-panel-cards-wrap { position: relative; z-index: 1; }
    .agenda-panel-cards { padding: 4px 24px 36px; margin: 0; }

    /* ---------- Event card: "poster" — foto penuh + overlay gradasi bawah
       menampung judul/lokasi/tanggal (bukan lagi thumb+body terpisah seperti
       kartu lain), badge tanggal mengambang gaya agenda-mini-date, chip
       status detail (Pendaftaran Dibuka/Ditutup untuk event akan datang,
       Berlangsung/Selesai untuk sisanya — bukan lagi "Akan Datang" generik
       yang tidak bilang apa-apa soal bisa/tidaknya masih daftar). ---------- */
    .event-card {
      position: relative; display: block; aspect-ratio: 3/4; border-radius: var(--radius-lg); overflow: hidden;
      box-shadow: var(--shadow-sm); transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    .event-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); text-decoration: none; }
    .event-card-media { position: relative; width: 100%; height: 100%; background: var(--color-primary-soft); }
    .event-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--motion-slow) ease; }
    @media (hover: hover) and (pointer: fine) { .event-card:hover .event-card-media img { transform: scale(1.06); } }
    .event-card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(4,20,10,.9) 0%, rgba(4,20,10,.3) 58%, transparent 78%);
    }
    .event-date-badge {
      position: absolute; top: 14px; left: 14px; display: flex; flex-direction: column; align-items: center;
      background: #fff; border-radius: 12px; padding: 6px 10px; box-shadow: var(--shadow-sm); line-height: 1;
    }
    .event-date-badge .day { font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; color: var(--color-primary-dark); }
    .event-date-badge .mon { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .event-status-chip {
      position: absolute; top: 14px; right: 14px; max-width: calc(100% - 90px); background: rgba(255,255,255,.92); color: var(--color-primary-dark);
      font-size: .68rem; font-weight: 800; padding: 4px 10px; border-radius: var(--radius-full); text-align: right;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .event-status-chip.open { background: var(--color-gold); color: #fff; }
    .event-status-chip.closed { background: rgba(255,255,255,.7); color: var(--color-muted); }
    .event-status-chip.ongoing { background: var(--color-gold); color: #fff; }
    .event-status-chip.past { background: rgba(255,255,255,.7); color: var(--color-muted); }
    .event-card-caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px; color: #fff; }
    .event-card-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
    .event-card-tags .chip { margin-bottom: 0; }
    .event-tag-pill {
      display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,.16); color: #fff;
      font-size: .7rem; font-weight: 600; padding: 3px 9px; border-radius: var(--radius-full);
    }
    .event-card-caption h3 { color: #fff; margin: 0 0 8px; font-size: 1.05rem; line-height: 1.3; }
    .event-card-date-range, .event-card-location {
      display: flex; align-items: center; gap: 5px; margin: 0 0 4px; font-size: .78rem; color: rgba(255,255,255,.85);
    }
    .event-card-location:last-of-type { margin-bottom: 0; }
    /* CTA halus yang muncul saat hover (desktop saja) — penegas afordansi
       klik, pola sama seperti .artikel-card-cta tapi tanpa background pill
       (sudah ada overlay gelap di baliknya) supaya tidak menumpuk elemen. */
    .event-card-hover-cta {
      display: flex; align-items: center; gap: 4px; margin-top: 10px; font-size: .78rem; font-weight: 700;
      color: #fff; opacity: 0; transform: translateY(4px);
      transition: opacity var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      .event-card:hover .event-card-hover-cta { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 720px) {
      .agenda-panel { margin-bottom: 24px; }
      .agenda-panel-intro { padding: 28px 20px 22px; }
      .agenda-panel-cards-wrap { padding: 0 16px 24px; }
      .agenda-panel-cards { padding: 0; }
      .event-card-hover-cta { display: none; }
    }

    /* ---------- FSLDK Goods: panel hijau full-width membungkus ikon+
       deskripsi+CTA "Lihat Semua" SEKALIGUS carousel kartu produk — shell-nya
       (silhouette/intro/cards-wrap) copy-paste PERSIS pola .agenda-panel*,
       cuma nama kelas beda supaya kedua section independen (tidak saling
       pengaruh kalau salah satu diubah lagi nanti). Bedanya dengan Agenda:
       kontennya CAROUSEL (track+panah), bukan grid statis — produk cenderung
       lebih banyak dari yang muat sekali layar. */
    .goods-panel {
      position: relative; overflow: hidden; margin-bottom: 40px;
      background: var(--color-primary); color: #fff; border-radius: var(--radius-lg);
      box-shadow: 0 10px 24px rgba(6,26,15,.14), 0 2px 8px rgba(6,26,15,.08);
    }
    .goods-panel-intro {
      position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center;
      gap: 12px; text-align: center; padding: 40px 24px 28px;
    }
    .goods-panel-silhouette {
      position: absolute; right: -30px; bottom: -30px; z-index: -1; color: rgba(255,255,255,.14);
      transform: rotate(-12deg); pointer-events: none;
    }
    .goods-panel-silhouette-2 {
      position: absolute; left: -16px; top: -16px; z-index: -1; color: rgba(255,255,255,.10);
      transform: rotate(16deg); pointer-events: none;
    }
    .goods-panel-icon { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.16); }
    .goods-panel-intro p { max-width: 540px; margin: 0; font-size: .92rem; line-height: 1.65; opacity: .92; }
    .goods-panel-cta {
      display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid rgba(255,255,255,.7);
      color: #fff; padding: 10px 22px; border-radius: var(--radius-sm); font-weight: 700; font-size: .76rem;
      letter-spacing: .04em; text-transform: uppercase; margin-top: 2px;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .goods-panel-cta:hover { background: #fff; color: var(--color-primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-lg); text-decoration: none; }
    /* Wrapper statis pemegang inset (pola sama seperti .agenda-panel-cards-
       wrap — lihat catatan panjang di sana soal kenapa padding kiri/kanan
       TIDAK boleh taruh di elemen yang scroll). */
    .goods-panel-cards-wrap { position: relative; z-index: 1; padding: 4px 24px 36px; }
    .goods-panel-track-wrap { position: relative; }
    .goods-panel-track {
      display: flex; gap: 20px; overflow-x: auto; scroll-behavior: smooth;
      scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch;
    }
    .goods-panel-track::-webkit-scrollbar { display: none; }
    .goods-panel-track .goods-card2 { flex: 0 0 250px; scroll-snap-align: start; }
    .goods-panel-arrow {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
      width: 40px; height: 40px; border-radius: 50%; border: none; background: #fff; box-shadow: var(--shadow-lg);
      display: grid; place-items: center; color: var(--color-primary-dark); cursor: pointer;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .goods-panel-arrow:hover { background: var(--color-primary); color: #fff; transform: translateY(-50%) scale(1.08); }
    .goods-panel-arrow.prev { left: -14px; }
    .goods-panel-arrow.next { right: -14px; }
    @media (max-width: 900px) { .goods-panel-arrow { display: none; } }
    @media (max-width: 720px) {
      .goods-panel { margin-bottom: 24px; }
      .goods-panel-intro { padding: 28px 20px 22px; }
      .goods-panel-cards-wrap { padding: 0 16px 24px; }
      .goods-panel-track { padding: 0; }
      .goods-panel-track .goods-card2 { flex-basis: 78%; }
    }

    /* ---------- Goods card: overlay hover berisi shortDescription + CTA
       (data yang tadinya tidak dipakai sama sekali di kartu ringkas
       beranda), ribbon "Unggulan" diagonal untuk isFeatured, badge stok
       untuk availabilityStatus selain 'available'. Strip thumbnail
       .goods-card2-gallery (previewImages, maks 3) ditumpuk di sudut
       kiri-bawah foto utama — ala shop.app (referensi user), gambar
       tambahan produk masuk ke DALAM foto utama, bukan galeri terpisah. ---------- */
    .goods-card2 { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .goods-card2:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); text-decoration: none; }
    .goods-card2-media { position: relative; aspect-ratio: 1/1; background: var(--color-primary-soft); overflow: hidden; }
    .goods-card2-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
    @media (hover: hover) and (pointer: fine) { .goods-card2:hover .goods-card2-media img { transform: scale(1.06); } }
    .goods-featured-ribbon {
      position: absolute; top: 14px; left: -32px; transform: rotate(-45deg); background: var(--color-gold); color: #fff;
      font-size: .66rem; font-weight: 800; letter-spacing: .03em; padding: 4px 36px; box-shadow: var(--shadow-sm);
    }
    .goods-unavailable-badge {
      position: absolute; top: 10px; right: 10px; background: rgba(22,33,28,.72); color: #fff;
      font-size: .7rem; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full);
    }
    /* Scrim hijau + nama produk di TENGAH foto — dua-duanya HOVER-ONLY
       (opacity 0 -> 1), balik ke pola transisi yang sudah ada sebelumnya
       (dulu .goods-card2-overlay), cuma teksnya sekarang nama produk
       ditengah (bukan shortDescription di bawah) dan scrim-nya menutup
       seluruh foto (bukan cuma gradient bawah) supaya kontras teks putih
       terjamin di mana pun namanya jatuh. */
    .goods-card2-scrim {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: linear-gradient(to top, rgba(4,55,26,.88) 0%, rgba(4,55,26,.5) 55%, rgba(4,55,26,.22) 100%);
      opacity: 0; transition: opacity var(--motion-base) ease;
    }
    @media (hover: hover) and (pointer: fine) { .goods-card2:hover .goods-card2-scrim { opacity: 1; } }
    .goods-card2-name-overlay {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, calc(-50% + 6px)); z-index: 2;
      max-width: calc(100% - 32px); padding: 0 16px; color: #fff; text-align: center;
      font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
      opacity: 0; pointer-events: none;
      transition: opacity var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      .goods-card2:hover .goods-card2-name-overlay { opacity: 1; transform: translate(-50%, -50%); }
    }
    /* Strip gambar tambahan — SELALU tampak (tidak ikut hover), z-index
       paling atas supaya tidak ketutup scrim/nama produk. */
    .goods-card2-gallery { position: absolute; left: 10px; bottom: 10px; z-index: 3; display: flex; gap: 6px; }
    .goods-card2-gallery-thumb {
      display: block; width: 54px; height: 54px; border-radius: 10px; overflow: hidden;
      border: 2.5px solid #fff; box-shadow: var(--shadow-md, var(--shadow-sm)); background: #fff;
    }
    .goods-card2-gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .goods-card2-price { display: block; margin-top: 10px; font-weight: 800; color: var(--color-primary-dark); font-size: 1.05rem; }

    /* Bar progres generik (.progress-track/.progress-fill/.progress-meta) —
       dipakai kartu campaign DAN bottom sheet preview (openPreview). Sebelum
       ini classnya dipakai di markup (sheet) tapi TIDAK PERNAH didefinisikan
       di sini — bar-nya render tanpa tinggi/warna (invisible bug). */
    .progress-track { height: 9px; border-radius: var(--radius-full); background: var(--color-bg-alt); overflow: hidden; margin-top: 10px; }
    .progress-fill { height: 100%; border-radius: var(--radius-full); background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark)); transition: width var(--motion-base) var(--ease-out); }
    .progress-meta { display: flex; justify-content: flex-end; margin: 6px 0 0; font-size: .78rem; font-weight: 700; color: var(--color-primary-dark); }

    /* ---------- Kantong Amal: redesign ala ldksyahid-app (home partial
       testimony) — grid kartu campaign + sidebar (badge/heading/deskripsi +
       2 stat card dampak nyata dari GET /public/campaigns/stats). Sidebar
       duluan di markup supaya tampil di ATAS di mobile, digeser ke kanan
       via properti CSS order di desktop (lihat .kantong-*). ---------- */
    .kantong-panel { display: grid; grid-template-columns: 1fr; gap: 28px; }
    .kantong-sidebar { order: 1; }
    .kantong-grid { order: 2; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    @media (min-width: 993px) {
      .kantong-panel { grid-template-columns: 1.6fr 1fr; align-items: start; }
      .kantong-grid { order: 1; }
      .kantong-sidebar { order: 2; position: sticky; top: 100px; }
    }
    .kantong-sidebar h2 { margin: 8px 0 10px; }
    .kantong-stats { display: flex; flex-direction: column; gap: 12px; margin: 20px 0 24px; }
    .kantong-stat-card {
      display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 18px 20px; box-shadow: var(--shadow-sm);
      transition: all var(--motion-fast) ease;
    }
    .kantong-stat-card:hover { border-color: var(--color-primary-soft); box-shadow: var(--shadow); transform: translateY(-2px); }
    .kantong-stat-icon {
      flex-shrink: 0; width: 46px; height: 46px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary-tint), var(--color-primary-soft));
      color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center;
    }
    .kantong-stat-content { display: flex; flex-direction: column; min-width: 0; }
    .kantong-stat-number { font-family: var(--font-heading); font-weight: 800; font-size: 1.4rem; color: var(--color-primary-dark); line-height: 1.15; }
    .kantong-stat-label { font-size: .8rem; color: var(--color-text-secondary); font-weight: 600; }

    /* ---------- Campaign card: badge/chip di atas foto, judul, bar progres
       linear + persen, lalu terkumpul/target berdampingan. ---------- */
    .campaign-card2-wrap { height: 100%; }
    .campaign-card2 { height: 100%; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .campaign-card2:hover { box-shadow: var(--shadow-lg); transform: translateY(-6px) scale(1.03); text-decoration: none; z-index: 1; }
    /* height tetap (bukan aspect-ratio) + flex-shrink:0 — supaya SEMUA
       kartu (foto landscape, sertifikat putih, dst.) tampil dengan tinggi
       gambar yang sama persis, tidak ikut mengecil/membesar mengikuti
       panjang judul di bawahnya seperti sebelumnya. */
    .campaign-card2-media { position: relative; flex-shrink: 0; height: 190px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .campaign-card2-media img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--motion-base) ease; }
    .campaign-card2:hover .campaign-card2-media img { transform: scale(1.06); }
    .campaign-card2-chip { position: absolute; left: 12px; top: 12px; }
    .campaign-card2-badge {
      position: absolute; right: 12px; top: 12px; background: var(--color-gold); color: var(--color-gold-dark, #5c4400);
      font-size: .7rem; font-weight: 800; padding: 4px 10px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }
    .campaign-card2-body { padding: 16px 18px 18px; display: flex; flex-direction: column; flex: 1; }
    .campaign-card2-body h3 { margin: 0; font-size: 1rem; line-height: 1.35; }
    .campaign-card2-amounts { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); }
    .campaign-card2-amount { display: flex; flex-direction: column; gap: 2px; }
    .campaign-card2-amount strong { font-size: .92rem; color: var(--color-text); }
    .campaign-card2-amount span { font-size: .74rem; color: var(--color-muted); }
    .campaign-card2-amount-target { margin-left: auto; text-align: right; }

    /* CTA "Lihat Semua" — style copy dari .gallery-btn-all/.jadwal-btn-all
       (pil gradient + swap gradient hover via ::before) supaya konsisten,
       sebelumnya .btn.btn-outline polos. */
    .campaign-btn-all {
      position: relative; display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff;
      padding: 8px 14px; border-radius: var(--radius-sm); font-weight: 700; font-size: .85rem;
      box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary-dark) 32%, transparent);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .campaign-btn-all::before {
      content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      opacity: 0; transition: opacity var(--motion-fast) ease;
    }
    .campaign-btn-all app-icon { transition: transform var(--motion-fast) ease; }
    .campaign-btn-all:hover {
      transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary-dark) 42%, transparent); text-decoration: none; color: #fff;
    }
    .campaign-btn-all:hover::before { opacity: 1; }
    .campaign-btn-all:hover app-icon { transform: translateX(4px); }
    @media (prefers-reduced-motion: reduce) { .campaign-btn-all::before { transition: none; } }

    /* Mobile: bukan carousel horizontal seperti section lain — daftar
       kartu horizontal (thumb kiri + info kanan) ditumpuk vertikal, sesuai
       referensi user (mirip list donasi ala kitabisa/benihbaik). */
    @media (max-width: 640px) {
      .kantong-grid { display: flex; flex-direction: column; gap: 14px; }
      .campaign-card2-wrap { height: auto; }
      .campaign-card2 { flex-direction: row; height: auto; }
      .campaign-card2-media { width: 112px; height: auto; flex-shrink: 0; }
      .campaign-card2-chip { font-size: .62rem; padding: 3px 8px; left: 8px; top: 8px; }
      .campaign-card2-badge { font-size: .58rem; padding: 3px 7px; right: 8px; top: 8px; }
      .campaign-card2-body { padding: 10px 14px; gap: 0; }
      .campaign-card2-body h3 { font-size: .88rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .progress-track { margin-top: 8px; }
      .campaign-card2-amounts { border-top: none; margin-top: 6px; padding-top: 0; }
      .campaign-card2-amount-target { display: none; }
    }

    /* ---------- Jadwal: kalender bulan berjalan (statis, tanpa toolbar
       prev/next — beda dari /jadwal index) + daftar agenda di bawahnya.
       Class & nilai visual sengaja MIRIP .cal- dan .agenda- di
       schedule.public-index.page.ts (styles komponen tidak lintas-komponen
       di Angular, jadi didefinisikan ulang di sini, bukan cuma reuse) —
       cuma dipersempit/dipadatkan supaya pas jadi satu section teaser di
       Beranda, bukan halaman penuh. ---------- */
    .jadwal-cal-wrap {
      max-width: 980px; margin: 0 auto 40px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm);
    }
    .jadwal-cal-period {
      margin: 0 0 18px; text-align: center; font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem;
      color: var(--color-primary-dark);
    }
    .jadwal-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .jadwal-cal-dow-cell { padding: 8px 6px; text-align: center; font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--color-muted); }
    .jadwal-cal-cell {
      position: relative; min-height: 108px; padding: 8px; border: 1px solid var(--color-border);
      margin: -0.5px; display: flex; flex-direction: column; gap: 4px; background: #fff;
      transition: background var(--motion-fast) ease, box-shadow var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .jadwal-cal-cell.out { background: var(--color-bg-alt); }
    .jadwal-cal-cell.out .jadwal-cal-date { color: var(--color-muted); }
    .jadwal-cal-cell.has { cursor: pointer; }
    .jadwal-cal-cell:hover, .jadwal-cal-cell:focus-within, .jadwal-cal-cell:focus { z-index: 30; outline: none; }
    /* Hover tanggal: naik+membesar tipis, latar tint hijau, ring dalam +
       shadow — bukan cuma inset box-shadow instan seperti sebelumnya. */
    .jadwal-cal-cell.has:hover {
      transform: translateY(-2px) scale(1.04); background: var(--color-primary-tint);
      box-shadow: inset 0 0 0 2px var(--color-primary), var(--shadow-md, var(--shadow-sm));
    }
    .jadwal-cal-cell.has:hover .jadwal-cal-date { color: var(--color-primary-dark); }
    .jadwal-cal-date { font-size: .92rem; font-weight: 600; color: var(--color-text-secondary); transition: color var(--motion-fast) ease; }
    .jadwal-cal-cell.today .jadwal-cal-date {
      background: var(--color-primary); color: #fff; border-radius: var(--radius-full);
      width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
    }
    @media (prefers-reduced-motion: reduce) { .jadwal-cal-cell, .jadwal-cal-date { transition: none; } }
    .jadwal-cal-chips { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
    .jadwal-cal-chip { display: flex; align-items: center; gap: 5px; font-size: .76rem; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text); }
    .jadwal-cal-chip .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .jadwal-cal-more { font-size: .7rem; color: var(--color-muted); }
    /* Titik kategori mobile-only (lihat media query di bawah) — pengganti
       .jadwal-cal-chips yang kepanjangan buat sel sesempit layar HP. */
    .jadwal-cal-dots { display: none; flex-wrap: wrap; gap: 3px; }
    .jadwal-cal-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    /* Popup muncul dengan fade+turun halus (bukan langsung nongol) — element
       baru yang Angular mount otomatis menjalankan animation-nya begitu
       masuk DOM, tidak perlu toggle class terpisah. Redesign: header jadi
       band hijau-tint dengan ikon (bukan teks polos), tiap kegiatan jadi
       baris kartu dengan titik kategori + accent kiri saat hover (bukan
       flex-wrap datar yang bikin badge kategori jatuh ke baris sendiri
       seperti sebelumnya) — accent-nya diambil dari warna kategori via
       custom property --jadwal-pop-accent per <li> (lihat [style.--...]
       di template), satu-satunya cara CSS baca warna dinamis per-item. */
    @keyframes jadwal-pop-in { from { opacity: 0; transform: translateY(-6px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    /* Jarak ke sel dinaikkan (100%-2px -> 100%+14px) supaya popup tidak
       "nempel" langsung ke ring hijau sel yang di-hover (kelihatan sempit/
       jelek kalau ketemu langsung) — arrow di bawah ini yang menjaga
       hubungan visualnya tetap jelas walau ada jarak. overflow:hidden
       DIPINDAH ke belakang (dihapus dari sini) karena arrow (posisi negatif,
       nongol di ATAS kotak) butuh keluar dari box ini — radius sudut atas
       dipindah ke .jadwal-cal-pop-head sendiri sebagai gantinya. */
    .jadwal-cal-pop {
      position: absolute; top: calc(100% + 14px); left: -1px; width: 300px; max-width: 82vw; z-index: 40;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); text-align: left; cursor: default;
      animation: jadwal-pop-in .18s var(--ease-out) both;
    }
    .jadwal-cal-cell:nth-child(7n) .jadwal-cal-pop, .jadwal-cal-cell:nth-child(7n-1) .jadwal-cal-pop { left: auto; right: -1px; }
    /* Panah kecil menghubungkan popup ke sel tanggal di atasnya — kotak
       diputar 45° dengan cuma sisi kiri+atas berwarna (2 border), meniru
       tampilan segitiga tooltip standar. */
    .jadwal-cal-pop-arrow {
      position: absolute; top: -7px; left: 24px; width: 13px; height: 13px; z-index: 1;
      background: var(--color-primary-tint); border-left: 1px solid var(--color-border); border-top: 1px solid var(--color-border);
      transform: rotate(45deg); border-radius: 3px 0 0 0;
    }
    .jadwal-cal-cell:nth-child(7n) .jadwal-cal-pop-arrow, .jadwal-cal-cell:nth-child(7n-1) .jadwal-cal-pop-arrow { left: auto; right: 24px; }
    .jadwal-cal-pop-head {
      position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: var(--color-primary-tint); color: var(--color-primary-dark); border-radius: var(--radius-md) var(--radius-md) 0 0;
    }
    .jadwal-cal-pop-date { margin: 0; font-weight: 700; font-size: .84rem; }
    .jadwal-cal-pop ul { list-style: none; margin: 0; padding: 6px 0; display: flex; flex-direction: column; max-height: 280px; overflow-y: auto; }
    .jadwal-cal-pop li {
      position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 9px 16px;
      transition: background var(--motion-fast) ease;
    }
    .jadwal-cal-pop li::before {
      content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; border-radius: var(--radius-full);
      background: var(--jadwal-pop-accent, var(--color-primary)); opacity: 0; transition: opacity var(--motion-fast) ease;
    }
    .jadwal-cal-pop li:hover { background: var(--color-bg-alt); }
    .jadwal-cal-pop li:hover::before { opacity: 1; }
    .jadwal-cal-pop li:last-child:hover { border-radius: 0 0 var(--radius-md) var(--radius-md); }
    .jadwal-cal-pop-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; }
    .jadwal-cal-pop-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .jadwal-cal-pop-title { font-weight: 700; font-size: .84rem; line-height: 1.35; color: var(--color-text); }
    .jadwal-cal-pop-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .jadwal-cal-pop-time { font-variant-numeric: tabular-nums; color: var(--color-muted); font-size: .74rem; font-weight: 600; }
    /* Penanggung jawab/panitia (Schedule.organizer) — baris terpisah di
       bawah waktu+kategori, bukan digabung ke .jadwal-cal-pop-meta supaya
       tidak ikut wrap berdesakan dengan badge kategori. */
    .jadwal-cal-pop-organizer { display: flex; align-items: center; gap: 5px; color: var(--color-muted); font-size: .74rem; }
    .jadwal-cat-badge { display: inline-block; padding: 1px 8px; border-radius: var(--radius-full); font-size: .68rem; font-weight: 700; }
    @media (prefers-reduced-motion: reduce) { .jadwal-cal-pop { animation: none; } }

    /* CTA "Lihat Semua" — style copy dari .artikel-btn-all (pil gradient +
       swap gradient hover via ::before, lihat catatan di sana) supaya
       konsisten dengan tombol "Lihat Semua" section lain. */
    .jadwal-btn-all {
      position: relative; display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff;
      padding: 8px 14px; border-radius: var(--radius-sm); font-weight: 700; font-size: .85rem;
      box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary-dark) 32%, transparent);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .jadwal-btn-all::before {
      content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      opacity: 0; transition: opacity var(--motion-fast) ease;
    }
    .jadwal-btn-all app-icon { transition: transform var(--motion-fast) ease; }
    .jadwal-btn-all:hover {
      transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary-dark) 42%, transparent); text-decoration: none; color: #fff;
    }
    .jadwal-btn-all:hover::before { opacity: 1; }
    .jadwal-btn-all:hover app-icon { transform: translateX(4px); }
    @media (prefers-reduced-motion: reduce) { .jadwal-btn-all::before { transition: none; } }

    /* Sheet mobile tap-tanggal (lihat daySheet/onScheduleCellClick di .ts). */
    .jadwal-daysheet-list { display: flex; flex-direction: column; gap: 16px; }
    .jadwal-daysheet-item { padding-top: 14px; border-top: 1px solid var(--color-border); }
    .jadwal-daysheet-item:first-child { padding-top: 0; border-top: none; }
    .jadwal-daysheet-item h4 { margin: 8px 0 4px; font-size: .98rem; }
    .jadwal-daysheet-meta { display: flex; flex-wrap: wrap; gap: 12px; color: var(--color-muted); font-size: .8rem; margin: 0 0 4px; }
    .jadwal-daysheet-meta span { display: inline-flex; align-items: center; gap: 5px; }
    .jadwal-daysheet-desc { color: var(--color-text-secondary); font-size: .86rem; margin: 4px 0 0; white-space: pre-line; }

    @media (max-width: 640px) {
      .jadwal-cal-cell { min-height: 44px; gap: 2px; }
      .jadwal-cal-chips { display: none; }
      .jadwal-cal-dots { display: flex; }
      .jadwal-cal-pop { display: none; }
    }

    /* ---------- Hubungi Kami: redesign ala ldksyahid-app (home partial
       contact-us) — panel kiri kutipan Al-Qur'an + info kontak resmi FSLDK
       (data sama dengan ContactPublicIndexPage, /tentang/kontak), panel
       kanan FORM interaktif terpasang langsung (bukan cuma tombol CTA ke
       halaman lain seperti sebelumnya). Validator & alur submit sama
       persis dengan halaman penuh (ContactRepository.sendPublic) supaya
       perilaku kedua form konsisten. ---------- */
    .contact-panel { display: grid; grid-template-columns: .82fr 1fr; gap: 28px; align-items: stretch; }
    .contact-panel-info { display: flex; flex-direction: column; gap: 20px; }
    .contact-quote-card {
      position: relative; overflow: hidden;
      background: #fff; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); padding: 28px;
      box-shadow: var(--shadow);
      transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    .contact-quote-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); }
    /* Motif siluet raksasa transparan — pola sama seperti panel hijau
       Berita/Perpustakaan/Agenda/Goods lainnya di beranda ini. */
    .contact-quote-silhouette {
      position: absolute; right: -14px; bottom: -18px; z-index: 0; color: var(--color-primary);
      opacity: .08; transform: rotate(8deg); pointer-events: none;
    }
    .contact-quote-icon {
      position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: var(--radius-full); color: var(--color-primary-dark);
      background: linear-gradient(135deg, var(--color-primary-tint), var(--color-primary-soft));
      margin-bottom: 16px;
    }
    .contact-quote-text { position: relative; z-index: 1; font-style: italic; color: var(--color-text); font-size: .92rem; line-height: 1.8; margin: 0 0 16px; }
    .contact-quote-source {
      position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff;
      padding: 7px 16px; border-radius: var(--radius-sm); font-size: .8rem; font-weight: 700;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary-dark) 30%, transparent);
    }
    .contact-method-list { display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .contact-method-item {
      display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: 16px 18px; box-shadow: var(--shadow-sm);
      transition: all var(--motion-fast) ease;
    }
    .contact-method-item:hover { border-color: var(--color-primary-soft); box-shadow: var(--shadow); transform: translateY(-2px) translateX(2px); }
    .contact-method-icon {
      flex-shrink: 0; width: 42px; height: 42px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary-tint), var(--color-primary-soft));
      color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center;
      transition: transform var(--motion-fast) var(--ease-out);
    }
    .contact-method-item:hover .contact-method-icon { transform: scale(1.08) rotate(-4deg); }
    .contact-method-body { display: flex; flex-direction: column; gap: 3px; }
    .contact-method-label { font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); }
    .contact-method-value { font-size: .92rem; font-weight: 600; color: var(--color-text); text-decoration: none; }
    a.contact-method-value:hover { color: var(--color-primary); text-decoration: underline; }

    .contact-panel-form {
      background: #fff; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 32px; box-shadow: var(--shadow);
      transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    .contact-panel-form:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
    .contact-form-head { text-align: center; margin-bottom: 24px; }
    .contact-form-icon {
      display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px;
      border-radius: var(--radius-full); color: #fff; margin-bottom: 12px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary-dark) 35%, transparent);
    }
    .contact-form-head h3 { margin: 0 0 4px; font-size: 1.25rem; }
    .contact-form-head p { margin: 0; font-size: .88rem; color: var(--color-text-secondary); }
    .contact-form-alert {
      display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e;
      padding: 10px 14px; border-radius: var(--radius-sm); font-size: .82rem; margin-bottom: 18px;
    }
    .contact-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .contact-form-group { margin-bottom: 16px; }
    .contact-form-group label { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: .84rem; color: var(--color-text); margin-bottom: 7px; }
    .contact-form-group .req { color: var(--color-danger); }
    .contact-form-group input, .contact-form-group textarea {
      width: 100%; padding: 12px 15px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm);
      font-size: .92rem; font-family: inherit; color: var(--color-text); background: #fff;
      transition: border-color var(--motion-fast), box-shadow var(--motion-fast); box-sizing: border-box;
    }
    .contact-form-group input:hover, .contact-form-group textarea:hover { border-color: var(--color-primary-soft); }
    .contact-form-group input:focus, .contact-form-group textarea:focus {
      outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px var(--color-primary-tint);
    }
    .contact-form-group input.is-invalid, .contact-form-group textarea.is-invalid { border-color: var(--color-danger); background: #fffbfa; }
    .contact-form-group textarea { resize: vertical; min-height: 110px; }
    .contact-form-error { display: block; margin-top: 5px; font-size: .78rem; color: var(--color-danger); font-weight: 500; }
    .contact-form-submit {
      width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; border: none;
      padding: 13px 20px; border-radius: var(--radius-sm); font-weight: 700; font-size: .95rem; cursor: pointer;
      box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary-dark) 32%, transparent);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .contact-form-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px color-mix(in srgb, var(--color-primary-dark) 42%, transparent); }
    .contact-form-submit:disabled { opacity: .7; cursor: not-allowed; }
    .contact-success { text-align: center; padding: 30px 10px; }
    .contact-success-icon { display: inline-flex; color: #16a34a; margin-bottom: 12px; }
    .contact-success h3 { margin: 0 0 8px; font-size: 1.2rem; }
    .contact-success p { margin: 0 0 20px; color: var(--color-text-secondary); font-size: .9rem; line-height: 1.55; }
    @media (max-width: 900px) {
      .contact-panel { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .contact-panel-form { padding: 22px; }
      .contact-form-row { grid-template-columns: 1fr; gap: 0; }
    }

    /* Heading kiri + CTA "Lihat Semua" sebaris di kanan (bukan dipusatkan
       di bawah kartu seperti draft awal) — mirror pola shop.app: judul
       section dan aksi utamanya sejajar. */
    .gallery-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
    .gallery-section-head-text { flex: 1; min-width: 0; }
    /* Duplikat mobile-only (lihat markup setelah .gallery-feature) —
       disembunyikan di desktop, tombol asli di header yang dipakai. */
    .gallery-btn-all-bottom { display: none; }
    @media (max-width: 640px) {
      .gallery-section-head { flex-direction: column; align-items: flex-start; }
      /* Tombol di header DIHILANGKAN di mobile (bukan cuma pindah posisi) —
         digantikan .gallery-btn-all-bottom di paling bawah kartu, supaya
         urutan baca mobile: judul → deskripsi → kartu → CTA, bukan CTA
         nyempil di antara deskripsi dan kartu. */
      .gallery-section-head .gallery-btn-all { display: none; }
      .gallery-btn-all-bottom { display: flex; margin-top: 20px; justify-content: center; }
    }

    /* ---------- Galeri: satu kartu "Dokumentasi Kegiatan Terbaru" ala
       ldksyahid-app (home partial gallery) — header gradient + badge foto/
       video, judul beraksen, deskripsi, mosaic foto (foto pertama full-
       width), thumbnail video YouTube (buka lightbox), link dokumentasi.
       Foto & video sama-sama bisa di-zoom/diputar di desktop MAUPUN mobile
       (responsif lewat media query grid, bukan kartu berbeda + bottom
       sheet terpisah seperti reference — di sini cuma SATU item, bukan
       daftar, jadi tap-untuk-buka-sheet tidak perlu). ---------- */
    .gallery-feature { background: #fff; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .gallery-feature:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
    .gallery-feature-head {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    }
    .gallery-feature-name { color: rgba(255,255,255,.9); font-size: .85rem; font-weight: 700; letter-spacing: .2px; }
    .gallery-feature-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    /* Solid (bukan ghost translucent) supaya bobot visualnya setara dengan
       badge Video yang sudah solid merah — sebelumnya badge Foto pakai
       background putih transparan tipis, kelihatan lemah/pudar di sebelah
       badge Video yang tegas. */
    .gallery-feature-badge {
      display: inline-flex; align-items: center; gap: 6px; background: #fff; color: var(--color-primary-dark);
      border-radius: var(--radius-full); padding: 5px 12px; font-size: .74rem; font-weight: 800;
      box-shadow: 0 3px 10px rgba(0,0,0,.15);
    }
    .gallery-feature-badge-video {
      background: linear-gradient(135deg, #ff5757, #dc2626); color: #fff;
      box-shadow: 0 3px 10px rgba(220,38,38,.4);
    }
    .gallery-feature-body { padding: 28px 28px 30px; }
    .gallery-feature-title { position: relative; margin: 0 0 10px; padding-left: 16px; font-size: 1.4rem; line-height: 1.35; }
    .gallery-feature-title::before {
      content: ''; position: absolute; left: 0; top: .15em; bottom: .1em; width: 4px; border-radius: 2px;
      background: linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark));
    }
    .gallery-feature-desc { color: var(--color-text-secondary); font-size: .92rem; line-height: 1.7; margin: 0 0 20px; }
    /* eventDescription sekarang dirender via [innerHTML] (rich text, lihat
       sanitizeGalleryDescription()) — isinya biasanya cuma satu <p> dari
       editor, reset margin bawaan browser-nya supaya card tetap sepadat
       sebelumnya (dulu elemen ini sendiri yang <p>, bukan pembungkus). */
    .gallery-feature-desc p { margin: 0; }
    .gallery-feature-desc p + p { margin-top: 10px; }
    .gallery-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
    .gallery-feature-grid-item { aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }
    .gallery-feature-grid-item:first-child { grid-column: 1 / -1; aspect-ratio: 21/7; }
    .gallery-feature-grid-item:hover { transform: scale(1.02); box-shadow: var(--shadow); }
    .gallery-feature-grid-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-feature-video { margin-bottom: 20px; }
    .gallery-feature-video-label { display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
    .gallery-feature-video-label app-icon { color: #ef4444; }
    .gallery-feature-video-thumb { position: relative; aspect-ratio: 16/7; border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }
    .gallery-feature-video-thumb:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .gallery-feature-video-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-feature-play {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 60px; height: 60px; border-radius: 50%;
      background: rgba(239,68,68,.88); color: #fff; display: flex; align-items: center; justify-content: center;
      transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .gallery-feature-video-thumb:hover .gallery-feature-play { background: #ef4444; transform: translate(-50%,-50%) scale(1.08); }
    .gallery-feature-footer { padding-top: 18px; border-top: 1px solid var(--color-border); }
    .gallery-feature-doc {
      display: inline-flex; align-items: center; gap: 7px; color: var(--color-text-secondary); font-size: .84rem; font-weight: 600;
      border: 1.5px solid var(--color-border); border-radius: var(--radius-full); padding: 8px 16px; transition: all var(--motion-fast) ease;
    }
    .gallery-feature-doc:hover { color: var(--color-primary); border-color: var(--color-primary-soft); background: var(--color-primary-tint); text-decoration: none; }
    @media (max-width: 640px) {
      .gallery-feature-body { padding: 22px 18px 24px; }
      .gallery-feature-grid { grid-template-columns: repeat(2, 1fr); }
      .gallery-feature-grid-item:first-child { aspect-ratio: 16/7; }
    }

    /* CTA "Lihat Semua" — style copy dari .jadwal-btn-all/.artikel-btn-all
       (pil gradient + swap gradient hover via ::before) supaya konsisten
       dengan tombol "Lihat Semua" section lain (sebelumnya beda gaya:
       .btn.btn-outline polos). */
    .gallery-btn-all {
      position: relative; display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff;
      padding: 8px 14px; border-radius: var(--radius-sm); font-weight: 700; font-size: .85rem;
      box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary-dark) 32%, transparent);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .gallery-btn-all::before {
      content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      opacity: 0; transition: opacity var(--motion-fast) ease;
    }
    .gallery-btn-all app-icon { transition: transform var(--motion-fast) ease; }
    .gallery-btn-all:hover {
      transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary-dark) 42%, transparent); text-decoration: none; color: #fff;
    }
    .gallery-btn-all:hover::before { opacity: 1; }
    .gallery-btn-all:hover app-icon { transform: translateX(4px); }
    @media (prefers-reduced-motion: reduce) { .gallery-btn-all::before { transition: none; } }

    /* Lightbox video YouTube (overlay fixed, selalu di DOM supaya transisi
       opacity mulus — mirip .gl-video-overlay ldksyahid-app; iframe cuma
       dirender saat aktif supaya video berhenti begitu ditutup). */
    .gallery-video-overlay {
      position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.88);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; transition: opacity var(--motion-base) ease;
    }
    .gallery-video-overlay.active { opacity: 1; pointer-events: all; }
    .gallery-video-wrap { width: min(90vw, 960px); aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.5); background: #000; }
    .gallery-video-wrap iframe { width: 100%; height: 100%; border: none; display: block; }
    .gallery-video-close {
      position: absolute; top: 24px; right: 24px; width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background var(--motion-fast) ease, transform var(--motion-fast) ease;
    }
    .gallery-video-close:hover { background: rgba(255,255,255,.28); transform: rotate(90deg); }

    /* font-body polos (bukan font-accent italic) + warna secondary yang lebih
       lembut — sama seperti perbaikan sebelumnya di kartu kutipan hero. */
    .lead { font-family: var(--font-body); font-size: 1.1rem; line-height: 1.6; color: var(--color-text-secondary); margin: 0; }

    /* ---------- Tentang Kami: tab terpadu (Tentang/Visi/Misi/Struktur),
       referensi struktur tab ldksyahid-app (about/index.blade.php) — tapi
       tiap panel dapat treatment visual sendiri (bukan satu kartu seragam),
       konsisten dengan pola aslinya (intro-card-cr/vision-card-cr/dll beda
       bentuk per tab). ---------- */
    .tentang-head { margin-bottom: 28px; }
    /* Satu bar pil tunggal (bukan tombol lepas-lepas) — pola tabs-cr-wrapper
       di ldksyahid-app (about/index.blade.php): pil aksen (.tentang-tabs-slider)
       meluncur di bawah tab aktif, posisinya dihitung dari offsetLeft/offsetWidth
       tombol asli lewat updateTentangTabSlider() di home.index.page.ts (bukan
       persentase tetap, karena tiap label beda panjang). Warna disesuaikan ke
       palet fsldk (hijau), bukan teal seperti aslinya. */
    .tentang-tabs { display: flex; justify-content: center; margin-bottom: 40px; }
    .tentang-tabs-bar {
      position: relative; display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 2px;
      background: #fff; padding: 6px; border-radius: 18px; box-shadow: var(--shadow-sm);
    }
    .tentang-tabs-slider {
      position: absolute; top: 6px; left: 0; width: 0; height: calc(100% - 12px); z-index: 1; pointer-events: none;
      border-radius: 14px; background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 4px 12px rgba(0,147,59,.28);
      transition: left .4s cubic-bezier(.4,0,.2,1), width .4s cubic-bezier(.4,0,.2,1);
    }
    .tentang-tab {
      position: relative; z-index: 2;
      display: flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 14px;
      border: none; background: transparent; color: var(--color-text-secondary);
      font-family: var(--font-heading); font-weight: 700; font-size: .88rem; cursor: pointer;
      transition: color var(--motion-fast) ease;
    }
    @media (hover: hover) and (pointer: fine) {
      .tentang-tab:not(.active):hover { color: var(--color-primary-dark); }
    }
    .tentang-tab.active { color: #fff; }
    .tentang-tab:active { transform: scale(.96); }
    @media (max-width: 480px) {
      .tentang-tabs-slider { display: none; }
      .tentang-tab.active { background: var(--color-primary); box-shadow: 0 4px 12px rgba(0,147,59,.28); }
    }
    .tentang-panel { max-width: 960px; margin: 0 auto; }
    /* Muncul ulang (fade+slide) tiap kali tab diganti — @switch di template
       me-render ulang elemen root tiap case, jadi animasi di sini otomatis
       replay setiap ganti tab (beda dari .reveal yang cuma sekali jalan saat
       scroll pertama, makanya panel-panel di bawah TIDAK pakai .reveal). */
    .tentang-fade { animation: tentang-fade-in .4s var(--ease-out) both; }
    @keyframes tentang-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    /* ===== Perkenalan (overview) — mengikuti about-img-cr/intro-card-cr di
       ldksyahid-app: kolom kiri logo (TANPA glow warna apa pun, cuma float
       halus) + label mengambang "Dakwah"/"Ukhuwah" + badge "Sejak" di sudut
       + kutipan italic; kolom kanan kartu putih header ikon + paragraf +
       grid sorotan singkat. ===== */
    /* Kolom gambar dipersempit (300px -> 260px, pas lebar .tentang-big-logo)
       supaya .tentang-intro-card di kanan lebih lebar — sorotan singkatnya
       (.tentang-features-grid) jadi bisa 3 kolom alih-alih 2, motong satu
       baris supaya kartu tidak terlalu panjang ke bawah. */
    .tentang-overview { display: grid; grid-template-columns: 260px 1fr; gap: 40px; align-items: center; }
    .tentang-img-col { text-align: center; }
    .tentang-img-frame { position: relative; display: inline-block; }
    /* Sengaja TIDAK ada glow/halo warna apa pun di belakang logo — cuma
       float halus naik-turun sebagai satu-satunya gerakannya. */
    .tentang-big-logo {
      width: 260px; height: 260px; object-fit: contain; display: block;
      filter: drop-shadow(0 14px 28px rgba(0,0,0,.14));
      animation: tentang-logo-float 4.5s ease-in-out infinite;
    }
    @keyframes tentang-logo-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .tentang-img-badge {
      position: absolute; bottom: -10px; right: -10px; z-index: 3; display: flex; flex-direction: column; align-items: center;
      background: #fff; border-radius: 16px; padding: .55rem 1rem; box-shadow: var(--shadow-lg);
      transition: transform var(--motion-base) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      .tentang-img-badge:hover { transform: scale(1.08) rotate(-4deg); }
    }
    .tentang-badge-est { font-size: .62rem; letter-spacing: .08em; text-transform: uppercase; color: var(--color-muted); }
    .tentang-badge-yr { font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: var(--color-primary); line-height: 1; }
    .tentang-img-tag {
      position: absolute; display: inline-flex; align-items: center; gap: 5px; z-index: 3;
      background: #fff; padding: .4rem .85rem; border-radius: var(--radius-full); font-size: .74rem; font-weight: 700;
      color: var(--color-primary-dark); box-shadow: var(--shadow-sm); animation: tentang-tag-float 4s ease-in-out infinite;
    }
    .tentang-img-tag.tag-1 { top: 8px; left: -14px; animation-delay: 0s; }
    .tentang-img-tag.tag-2 { bottom: 34px; left: -22px; animation-delay: 1.5s; }
    @keyframes tentang-tag-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .tentang-img-caption { margin: 20px auto 0; max-width: 280px; font-style: italic; color: var(--color-text-secondary); font-size: .88rem; line-height: 1.6; }

    .tentang-intro-card {
      position: relative; overflow: hidden; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 32px;
    }
    /* Wash sudut lembut — motif sama seperti .tentang-visi-block, jaga
       kartu ini tidak terasa putih polos dibanding panel Visi/Misi/Struktur. */
    .tentang-intro-card::before {
      content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: radial-gradient(ellipse 55% 45% at 100% 0%, var(--color-primary-tint) 0%, transparent 70%);
    }
    .tentang-intro-card > * { position: relative; z-index: 1; }
    .tentang-intro-header { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
    /* Kotak ikon gradient + cincin transparan yang berdenyut membesar-
       menghilang di sekelilingnya — dipakai ulang oleh Visi (.tentang-visi-icon-box). */
    .tentang-icon-box {
      position: relative; width: 56px; height: 56px; flex-shrink: 0; display: grid; place-items: center;
      border-radius: 16px; background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      color: #fff; box-shadow: var(--shadow-sm);
    }
    .tentang-icon-ring {
      position: absolute; inset: -4px; border: 2px solid var(--color-primary-soft); border-radius: 20px;
      animation: tentang-icon-ring-pulse 3s ease-in-out infinite;
    }
    @keyframes tentang-icon-ring-pulse { 0%, 100% { transform: scale(1); opacity: .6; } 50% { transform: scale(1.15); opacity: 0; } }
    .tentang-intro-title { margin: 0; font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; color: var(--color-text); }
    .tentang-intro-subtitle { font-size: .82rem; color: var(--color-text-secondary); }
    .tentang-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
    .tentang-feature {
      position: relative; overflow: hidden; display: flex; align-items: center; gap: 8px;
      padding: 11px 14px; background: var(--color-primary-tint); border-radius: 12px;
      font-size: .85rem; font-weight: 600; color: var(--color-text);
      transition: transform var(--motion-fast) var(--ease-out), color var(--motion-fast) ease;
    }
    .tentang-feature app-icon { color: var(--color-primary); flex-shrink: 0; }
    .tentang-feature::after {
      content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent); transition: left .6s ease;
    }
    @media (hover: hover) and (pointer: fine) {
      .tentang-feature:hover { transform: translateY(-2px); color: var(--color-primary-dark); }
      .tentang-feature:hover::after { left: 100%; }
    }

    /* ===== Visi — medalion ikon kompas (motif icon-box sama seperti
       Perkenalan) + pernyataan besar bergaya kutipan, ditutup garis gradient
       yang "menggambar diri" tiap kali tab ini dibuka. ===== */
    .tentang-visi-block {
      position: relative; overflow: hidden; text-align: center; background: #fff;
      border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
      padding: 48px 40px;
    }
    /* Wash radial lembut + pola titik halus di latar (motif sama seperti
       .hero-texture) — dulu kartu ini putih polos, sekarang punya kedalaman
       tanpa mengganggu keterbacaan kutipan di atasnya. */
    .tentang-visi-block::before {
      content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 70% 60% at 50% 0%, var(--color-primary-tint) 0%, transparent 70%),
        radial-gradient(circle, var(--color-primary-soft) 1.4px, transparent 1.5px);
      background-size: auto, 24px 24px;
      opacity: .8;
    }
    /* Medalion ikon dikelilingi 3 titik dekorasi yang mengorbit pelan +
       berdenyut bergantian — mengganti cincin berdenyut statis (yang masih
       dipakai Perkenalan), pola sama seperti .v-icon-orbit di ldksyahid-app. */
    .tentang-visi-icon-wrap { position: relative; z-index: 1; display: inline-block; margin-bottom: 20px; }
    .tentang-visi-icon-box { position: relative; z-index: 1; width: 72px; height: 72px; margin: 0; }
    .tentang-visi-orbit { position: absolute; inset: -22px; animation: tentang-visi-orbit-spin 12s linear infinite; }
    .tentang-visi-orbit-dot { position: absolute; font-size: .95rem; animation: tentang-visi-orbit-pulse 3s ease-in-out infinite; animation-delay: var(--delay); }
    .tentang-visi-orbit-dot:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); }
    .tentang-visi-orbit-dot:nth-child(2) { bottom: 6px; left: 2px; }
    .tentang-visi-orbit-dot:nth-child(3) { bottom: 6px; right: 2px; }
    @keyframes tentang-visi-orbit-spin { to { transform: rotate(360deg); } }
    @keyframes tentang-visi-orbit-pulse { 0%, 100% { opacity: .4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
    .tentang-visi-title {
      position: relative; z-index: 1; margin: 0 0 18px; font-family: var(--font-heading);
      font-weight: 800; font-size: 1.2rem; color: var(--color-text);
    }
    .tentang-visi-quote-mark { font-family: var(--font-display); font-size: 1.7rem; font-weight: 800; color: var(--color-primary); opacity: .4; line-height: 0; vertical-align: -.28em; }
    .tentang-visi-hl { position: relative; color: var(--color-primary-dark); font-weight: 700; }
    .tentang-visi-hl::after { content: ''; position: absolute; left: 0; bottom: 1px; width: 100%; height: 3px; border-radius: 2px; background: var(--color-primary-soft); z-index: -1; }
    .tentang-visi-statement {
      position: relative; z-index: 1; max-width: 640px; margin: 0 auto 28px; font-family: var(--font-accent);
      font-style: italic; font-weight: 600; font-size: clamp(1.15rem, 2vw, 1.5rem); line-height: 1.6; color: var(--color-text);
    }
    /* Pilar kunci dari kalimat visi (sinergi / LDK se-Indonesia / Indonesia
       madani) — chip yang menampilkan penjelasan singkat saat di-hover,
       pola sama seperti .pillar-cr + .pillar-hover-card di ldksyahid-app. */
    .tentang-visi-pillars { position: relative; z-index: 1; display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }
    .tentang-visi-pillar {
      position: relative; display: flex; align-items: center; gap: 8px; padding: 10px 20px;
      background: var(--color-primary-tint); border-radius: var(--radius-full); font-weight: 600; font-size: .88rem;
      color: var(--color-primary-dark); transition: transform var(--motion-base) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      .tentang-visi-pillar:hover { transform: translateY(-4px); }
    }
    .tentang-visi-pillar-icon { font-size: 1.1rem; }
    .tentang-visi-pillar-card {
      position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%) translateY(8px);
      width: 210px; background: #fff; border: 1px solid var(--color-border); border-radius: 12px;
      box-shadow: var(--shadow-lg); padding: .85rem 1rem; opacity: 0; visibility: hidden; z-index: 10;
      transition: opacity var(--motion-base) ease, transform var(--motion-base) ease, visibility var(--motion-base);
    }
    .tentang-visi-pillar-card::after {
      content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
      border: 6px solid transparent; border-top-color: #fff;
    }
    .tentang-visi-pillar-card p { margin: 0; font-size: .8rem; font-style: normal; line-height: 1.5; color: var(--color-text-secondary); }
    @media (hover: hover) and (pointer: fine) {
      .tentang-visi-pillar:hover .tentang-visi-pillar-card { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
    }
    @media (hover: none), (pointer: coarse) {
      .tentang-visi-pillar-card { display: none; }
    }

    /* ===== Misi — grid 7 kartu bernomor dengan ikon berbeda per misi,
       terangkat halus saat hover, muncul bergelombang (stagger, lewat
       [style.animation-delay.ms] di template) tiap kali tab ini dibuka.
       Grid 12 kolom murni via nth-child: baris 1 = 3 kartu (span 4/12),
       baris 2 = 4 kartu (span 3/12) — jadi kedua baris selalu terisi penuh
       tanpa kartu yang menggantung sendirian, dan kartu sedikit dikecilkan
       (padding/ikon/font) supaya proporsional pas 4 kartu sebaris. ===== */
    .tentang-misi-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
    .tentang-misi-card:nth-child(-n+3) { grid-column: span 4; }
    .tentang-misi-card:nth-child(n+4) { grid-column: span 3; }
    .tentang-misi-card {
      position: relative; overflow: hidden; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 20px 18px 16px;
      animation: tentang-card-pop .45s var(--ease-out) both;
      transition: transform var(--motion-base) var(--ease-out), box-shadow var(--motion-base) ease, border-color var(--motion-fast) ease;
    }
    @keyframes tentang-card-pop { from { opacity: 0; transform: translateY(18px) scale(.96); } to { opacity: 1; transform: none; } }
    /* Cincin aksen gradient yang berputar mengelilingi tepi kartu saat hover
       (bukan cuma garis di atas) — trik mask conic-gradient dengan sudut
       (--tentang-misi-angle) yang dianimasikan via @property, jadi cuma
       warnanya yang "berjalan" keliling tepi, bentuk cincinnya sendiri diam
       mengikuti border-radius (tidak perlu transform:rotate yang bisa
       kepotong overflow:hidden pada kartu). */
    .tentang-misi-card::before {
      content: ''; position: absolute; inset: 0; z-index: 2; border-radius: inherit; padding: 2px;
      background: conic-gradient(from var(--tentang-misi-angle), transparent, var(--color-primary), var(--color-gold), var(--color-ember), transparent);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0; pointer-events: none;
      transition: opacity var(--motion-base) ease;
    }
    @property --tentang-misi-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
    @keyframes tentang-misi-border-spin { to { --tentang-misi-angle: 360deg; } }
    @media (hover: hover) and (pointer: fine) {
      .tentang-misi-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--color-primary-soft); }
      .tentang-misi-card:hover::before { opacity: 1; animation: tentang-misi-border-spin 2.4s linear infinite; }
    }
    .tentang-misi-number { position: absolute; top: 12px; right: 16px; font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; line-height: 1; color: var(--color-primary-soft); }
    .tentang-misi-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; margin-bottom: 12px; background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff; box-shadow: var(--shadow-sm); }
    /* Ikon berselang-seling 3 aksen warna (hijau/emas/ember) — dulu semua
       kartu pakai gradient hijau seragam, sekarang gridnya kelihatan lebih
       hidup/berwarna tanpa mengubah data (murni nth-child, cyclic per 3). */
    .tentang-misi-card:nth-child(3n+2) .tentang-misi-icon { background: linear-gradient(150deg, var(--color-gold), var(--color-gold-dark)); }
    .tentang-misi-card:nth-child(3n) .tentang-misi-icon { background: linear-gradient(150deg, var(--color-ember), var(--color-ember-dark)); }
    .tentang-misi-card p { margin: 0; color: var(--color-text-secondary); font-size: .86rem; line-height: 1.5; }

    /* ===== Misi (mobile) — amplop surat menggantikan grid di layar sempit
       (lihat toggle display di breakpoint 720px). Ketuk amplop memicu class
       .open yang menganimasikan 3 lapisan sekaligus murni lewat transisi CSS
       (flap terbuka via rotateX, surat mengintip naik, seal memudar) —
       elemen TIDAK di-mount/unmount lewat @if (pola sama seperti
       BottomSheetComponent/.sheet-overlay), jadi transisi buka & tutup
       sama-sama mulus tanpa perlu setTimeout. ===== */
    .misi-envelope { display: none; }
    @media (max-width: 720px) {
      .tentang-misi-grid { display: none; }
      .misi-envelope {
        display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 260px;
        margin: 8px auto 0; padding: 0; border: none; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent;
      }
    }
    .misi-envelope-stage {
      position: relative; width: 100%; aspect-ratio: 3 / 2; perspective: 1000px;
      animation: misi-envelope-bob 2.8s ease-in-out infinite;
    }
    .misi-envelope.open .misi-envelope-stage { animation-play-state: paused; }
    @keyframes misi-envelope-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
    .misi-envelope-shadow {
      position: absolute; left: 8%; right: 8%; bottom: -10px; height: 14px; border-radius: 50%;
      background: rgba(22,33,28,.16); filter: blur(4px);
      transition: opacity var(--motion-base) ease, transform var(--motion-base) ease;
    }
    .misi-envelope.open .misi-envelope-shadow { opacity: .5; transform: scaleX(.85); }
    /* Badan amplop kertas krem (bukan hijau solid) + dua garis lipatan
       samar (gradient diagonal terang/gelap, motif kertas terlipat X-seam
       amplop asli) — jauh lebih meyakinkan sebagai foto amplop sungguhan
       ketimbang kotak gradient hijau polos sebelumnya. */
    .misi-envelope-back {
      position: absolute; inset: 0; border-radius: 8px;
      border: 1px solid rgba(22,33,28,.08);
      background:
        linear-gradient(200deg, transparent 48%, rgba(0,0,0,.07) 50%, transparent 52%),
        linear-gradient(160deg, transparent 48%, rgba(255,255,255,.4) 50%, transparent 52%),
        linear-gradient(165deg, #fffef9 0%, #f2ecdc 100%);
      box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,.7);
    }
    .misi-envelope-letter {
      position: absolute; left: 12%; right: 12%; top: 18%; bottom: 30%; z-index: 1;
      background: #fff; border-radius: 6px; box-shadow: 0 6px 14px rgba(22,33,28,.16), 0 0 0 1px rgba(22,33,28,.05);
      padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 5px; justify-content: flex-end;
      transform: translateY(10%); transition: transform .55s cubic-bezier(.16,1,.3,1);
    }
    .misi-envelope.open .misi-envelope-letter { transform: translateY(-62%); }
    /* Judul "Misi FSLDK Indonesia" ditaruh DI DALAM kartu surat putih (bukan
       lagi overlay terpisah di badan amplop krem) supaya selalu terbaca di
       atas putih, dan diletakkan di bagian bawah kartu (justify-content:
       flex-end di atas) supaya tidak ketiban seal lilin yang duduk di
       tengah-atas kartu. */
    .misi-envelope-letter-title {
      font-family: var(--font-heading); font-weight: 800; font-size: .72rem; letter-spacing: .01em;
      line-height: 1.25; text-align: center; color: var(--color-primary-dark);
    }
    .misi-envelope-letter-line { height: 5px; border-radius: 3px; background: var(--color-primary-soft); }
    .misi-envelope-letter-line.short { width: 60%; }
    /* Flap tetap krem/coklat muda di kedua state (tertutup MAUPUN terbuka) —
       hanya beda gradasi untuk kesan sisi-dalam terlipat, TIDAK berubah jadi
       hijau, supaya amplop tetap konsisten sebagai kertas coklat/krem. */
    .misi-envelope-flap {
      position: absolute; top: 0; left: 0; right: 0; height: 56%; z-index: 2;
      clip-path: polygon(0 0, 100% 0, 50% 90%);
      background: linear-gradient(165deg, #f8f2e4, #e8dfca);
      transform-origin: top center; transform: rotateX(0deg);
      transition: transform .5s cubic-bezier(.16,1,.3,1), background .4s ease, box-shadow .5s ease;
      box-shadow: 0 6px 10px rgba(0,0,0,.14);
    }
    .misi-envelope.open .misi-envelope-flap {
      transform: rotateX(-170deg); box-shadow: none;
      background: linear-gradient(165deg, #e9dcc0, #d8c6a0);
    }
    /* Seal lilin mengilap — radial-gradient off-center (highlight) + inset
       shadow ganda (terang di atas, gelap di bawah) untuk kesan timbul. */
    .misi-envelope-seal {
      position: absolute; top: 42%; left: 50%; z-index: 3; transform: translate(-50%, -50%) scale(1);
      width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center;
      background: radial-gradient(circle at 34% 30%, var(--color-gold) 0%, var(--color-gold-dark) 75%); color: #fff;
      box-shadow: 0 3px 7px rgba(0,0,0,.28), inset 0 1px 2px rgba(255,255,255,.5), inset 0 -2px 3px rgba(0,0,0,.22);
      transition: opacity .35s ease, transform .35s ease;
    }
    .misi-envelope.open .misi-envelope-seal { opacity: 0; transform: translate(-50%, -50%) scale(.4); }
    /* Isi app-bottom-sheet carousel misi — @for dgn key misiActiveIndex() di
       template memaksa Angular re-render .misi-sheet-content tiap ganti
       slide, supaya animation slide-in-nya (arah beda utk next/prev) replay
       tiap kali, bukan cuma sekali saat sheet pertama dibuka. */
    .misi-sheet-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 8px 4px 20px; }
    .misi-sheet-content.dir-next { animation: misi-sheet-slide-next .35s var(--ease-out) both; }
    .misi-sheet-content.dir-prev { animation: misi-sheet-slide-prev .35s var(--ease-out) both; }
    @keyframes misi-sheet-slide-next { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes misi-sheet-slide-prev { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
    .misi-sheet-number { font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: var(--color-primary); }
    .misi-sheet-icon { display: grid; place-items: center; width: 56px; height: 56px; margin: 6px 0 16px; border-radius: 18px; background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff; box-shadow: var(--shadow-sm); }
    .misi-sheet-text { margin: 0; font-size: 1.05rem; font-weight: 600; line-height: 1.6; color: var(--color-text); }
    .misi-sheet-nav { display: flex; align-items: center; justify-content: center; gap: 18px; }
    .misi-sheet-arrow {
      display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--color-border);
      background: #fff; color: var(--color-primary-dark); cursor: pointer; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease;
    }
    .misi-sheet-arrow:active { background: var(--color-primary-tint); border-color: var(--color-primary-soft); }
    .misi-sheet-dots { display: flex; align-items: center; gap: 6px; }
    .misi-sheet-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-border-strong); transition: background var(--motion-fast) ease, transform var(--motion-fast) ease; }
    .misi-sheet-dot.active { background: var(--color-primary); transform: scale(1.3); }

    /* ===== Struktur — hub (Puskomnas) + connector + grid kartu turunan,
       mengikuti pola #tab-keluarga di ldksyahid-app (about/index.blade.php:
       .kl-pusat-card / .kl-connector / .kl-grid / .kl-card), warna
       disesuaikan ke palet fsldk. ===== */
    .tentang-struktur { max-width: 880px; margin: 0 auto; }
    .struktur-pusat-wrap { display: flex; justify-content: center; }
    .struktur-pusat-card {
      position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 6px;
      background: #fff; border: 2px solid var(--color-primary-soft); border-radius: 24px; padding: 26px 44px;
      animation: tentang-struktur-pusat-glow 4s ease-in-out infinite;
    }
    @keyframes tentang-struktur-pusat-glow {
      0%, 100% { box-shadow: 0 8px 30px rgba(0,147,59,.12); }
      50% { box-shadow: 0 8px 40px rgba(0,147,59,.24), 0 0 0 8px rgba(0,147,59,.06); }
    }
    .struktur-pusat-badge {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff;
      font-family: var(--font-heading); font-size: .68rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      padding: 5px 16px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm); white-space: nowrap;
    }
    .struktur-pusat-icon {
      display: grid; place-items: center; width: 60px; height: 60px; margin-bottom: 4px; border-radius: 18px;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff; box-shadow: var(--shadow-sm);
    }
    .struktur-pusat-name { font-family: var(--font-heading); font-weight: 800; font-size: 1.1rem; color: var(--color-text); }
    .struktur-pusat-sub { font-size: .8rem; color: var(--color-text-secondary); text-align: center; max-width: 320px; }
    .struktur-connector { display: flex; flex-direction: column; align-items: center; padding: 0 2rem; }
    .struktur-connector-line { width: 3px; height: 26px; border-radius: 3px; background: linear-gradient(180deg, var(--color-primary), var(--color-primary-soft)); }
    .struktur-connector-spread {
      position: relative; width: 72%; height: 3px; border-radius: 3px;
      background: linear-gradient(90deg, transparent, var(--color-primary) 20%, var(--color-primary) 80%, transparent);
    }
    .struktur-connector-spread::before, .struktur-connector-spread::after {
      content: ''; position: absolute; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary);
    }
    .struktur-connector-spread::before { left: 20%; }
    .struktur-connector-spread::after { right: 20%; }
    .struktur-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 26px; }
    .struktur-card {
      position: relative; flex: 0 1 220px; display: flex; flex-direction: column; align-items: center; gap: 8px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
      padding: 22px 18px 18px; text-align: center;
      animation: tentang-card-pop .45s var(--ease-out) both;
      transition: transform var(--motion-base) var(--ease-out), box-shadow var(--motion-base) ease, border-color var(--motion-fast) ease;
    }
    @media (hover: hover) and (pointer: fine) {
      .struktur-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--color-primary-soft); }
    }
    .struktur-card-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff; box-shadow: var(--shadow-sm); }
    /* Aksen warna berselang-seling sama seperti kartu Misi. */
    .struktur-card:nth-child(3n+2) .struktur-card-icon { background: linear-gradient(150deg, var(--color-gold), var(--color-gold-dark)); }
    .struktur-card:nth-child(3n) .struktur-card-icon { background: linear-gradient(150deg, var(--color-ember), var(--color-ember-dark)); }
    .struktur-card-name { font-family: var(--font-heading); font-weight: 700; font-size: .95rem; color: var(--color-text); }
    .struktur-card-desc { margin: 0; font-size: .78rem; line-height: 1.5; color: var(--color-text-secondary); }

    @media (prefers-reduced-motion: reduce) {
      .tentang-fade, .tentang-big-logo, .tentang-icon-ring, .tentang-img-tag,
      .tentang-visi-orbit, .tentang-visi-orbit-dot,
      .tentang-misi-card, .struktur-pusat-card, .struktur-card,
      .misi-envelope-stage, .misi-sheet-content {
        animation: none;
      }
      .tentang-fade, .tentang-misi-card, .struktur-card, .misi-sheet-content { opacity: 1; transform: none; }
      .tentang-tabs-slider, .misi-envelope-shadow, .misi-envelope-letter, .misi-envelope-flap, .misi-envelope-seal {
        transition: none;
      }
    }
    @media (max-width: 900px) {
      .tentang-misi-grid { grid-template-columns: repeat(2, 1fr); }
      .tentang-misi-card:nth-child(-n+3), .tentang-misi-card:nth-child(n+4) { grid-column: span 1; }
      .tentang-features-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 720px) {
      .tentang-overview { grid-template-columns: 1fr; text-align: center; gap: 28px; }
      .tentang-img-tag.tag-1 { top: 5px; left: 5px; }
      .tentang-img-tag.tag-2 { bottom: 35px; left: 0; }
      .tentang-big-logo { width: 220px; height: 220px; }
      .tentang-intro-card { padding: 24px; }
      .tentang-features-grid { grid-template-columns: 1fr; }
      .tentang-visi-block { padding: 40px 24px; }
      .tentang-misi-grid { grid-template-columns: 1fr; }
      .struktur-pusat-card { padding: 22px 28px; }
      .struktur-card { flex-basis: 100%; }
    }

    /* ---------- CTA: satu-satunya medan hijau penuh di halaman ini (bagian
       dalam kartu saja) — bagian luar tetap memakai kanvas lembut yang sama
       seperti bagian lain, datar tanpa gradasi gelap. ---------- */
    .cta-band { padding-top: 8px; }
    .cta-inner {
      background: var(--color-primary); color: #fff; border-radius: var(--radius-lg); padding: 40px 36px;
      display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
    }
    .cta-inner h2 { color: #fff; margin-bottom: 6px; }
    .cta-btn { background: #fff; color: var(--color-primary-dark); flex-shrink: 0; }
    .cta-btn:hover { background: #fff; color: var(--color-primary-dark); opacity: .92; }

    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr; }
      .hero-network { margin-top: 8px; }
      .hero-network-svg { height: 190px; }
      .hero-network-caption { max-width: 100%; }
      .hero-network-caption-text { font-size: .82rem; }
      .cta-inner { flex-direction: column; align-items: flex-start; }
    }

    /* Animasi baru di hero (entrance staggered, garis gambar peta, fade-in
       jaringan, kartu kutipan, tooltip) semuanya dihormati prefers-reduced-
       motion — dimatikan total, langsung tampil final tanpa gerakan. Path
       drawing-nya sendiri sudah dicek terpisah lewat JS di
       animateIslandPath(). */
    @media (prefers-reduced-motion: reduce) {
      .hero-badge, .hero-title, .hero-sub, .network-overlay, .hero-network-caption {
        opacity: 1; animation: none;
      }
      .network-tooltip { animation: none; }
      .hero-network-caption:hover { transform: none; }
      .hero-wave-clip svg { animation: none; }
    }

    /* ---------- Preview bottom sheet (mobile) — isi generik lintas tipe kartu. ---------- */
    /* Kotak biasa (bukan full-bleed) — dulu pakai margin negatif buat
       "menembus" padding .sheet-panel sampai ke tepi, tapi itu ikut menutupi
       .sheet-handle/.sheet-close yang duduk di zona padding-top yang sama
       (foto menimpa handle+tombol X). Sengaja TIDAK menyentuh margin-top
       supaya jarak dari handle/close tetap seperti bawaan .sheet-panel. */
    /* Kotak mengambang di dalam padding panel (bukan full-bleed ke tepi) —
       radius bulat di keempat sisi seperti versi sebelumnya, cuma tingginya
       yang dibesarkan (190->300px) supaya kelihatan "gambar utama", bukan
       thumbnail kecil di atas judul. */
    .sheet-image { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; }
    .sheet-image img { display: block; width: 100%; height: 300px; object-fit: cover; object-position: center top; }
    /* Strip thumbnail gambar tambahan (mis. Goods.previewImages) — baris
       kecil di bawah foto utama sheet, bukan overlay di atas foto (beda dari
       versi kartu .goods-card2-gallery) supaya tidak menumpuk di ruang
       sheet yang sempit dan sudah vertikal-scroll. */
    .sheet-gallery { display: flex; gap: 8px; margin: 0 0 16px; }
    .sheet-gallery-thumb { width: 64px; height: 64px; flex-shrink: 0; border-radius: 10px; object-fit: cover; box-shadow: var(--shadow-sm); }
    .sheet-title { margin: 0 0 16px; }
    .sheet-meta-line { margin: 0 0 4px; }
    /* Baris meta berlabel ikon (Penulis/Editor/Tanggal) — pola sama seperti
       kartu preview artikel di ldksyahid-app, dipakai lewat metaRows (berita)
       sebagai alternatif metaLines polos (artikel/campaign, tetap dipakai). */
    .sheet-meta-rows { margin: 0 0 20px; display: flex; flex-direction: column; gap: 12px; }
    .sheet-meta-row { display: flex; align-items: flex-start; gap: 10px; }
    .sheet-meta-icon {
      flex-shrink: 0; margin-top: 1px; width: 26px; height: 26px; border-radius: 8px;
      display: grid; place-items: center; background: var(--color-primary-tint); color: var(--color-primary-dark);
    }
    .sheet-meta-label { display: block; font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-muted); }
    .sheet-meta-value { display: block; font-size: .88rem; font-weight: 600; color: var(--color-text); }
    /* Excerpt/ringkasan — ala ldksyahid-app news-sheet__excerpt: teks penuh
       (tanpa line-clamp), justify, line-height lega supaya tidak berkesan
       padat/mepet seperti metaRows yang langsung nempel CTA sebelumnya. */
    .sheet-excerpt { margin: 0 0 20px; font-size: .88rem; line-height: 1.7; text-align: justify; color: var(--color-text-secondary); }
    /* Tombol CTA sheet (pil gradient + warna aksen per-kartu) sekarang
       di-render langsung oleh app-bottom-sheet lewat [ctaLabel]/[ctaAccent]/
       (ctaClick) — bukan lagi di sini. Lihat bottom-sheet.component.ts
       untuk alasan content projection ditinggalkan untuk footer ini. */

    /* ---------- Card scroller: pengganti .grid.grid-3 KHUSUS di halaman ini
       untuk daftar kartu (berita/artikel/buku/event/goods/campaign) — di
       desktop tampil sebagai grid 3 kolom biasa, di mobile jadi horizontal
       scroll-snap (bukan tumpukan 1 kolom) mengikuti referensi ldksyahid-app.
       Sengaja class terpisah, BUKAN mengubah .grid-3 global di styles.scss,
       supaya halaman/module lain yang reuse .grid-3 tidak ikut berubah. ---------- */
    .card-scroller { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 900px) { .card-scroller { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) {
      .card-scroller {
        display: flex; overflow-x: auto; gap: 14px; padding: 4px 4px 14px; margin: -4px -4px 0;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;
      }
      .card-scroller::-webkit-scrollbar { display: none; }
      .card-scroller > * { flex: 0 0 78%; scroll-snap-align: start; }
    }
  `],
})
export class HomeIndexPage implements OnInit, AfterViewInit, HomeIndexView {
  private presenter = inject(HomeIndexPresenter);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  contactRepo = inject(ContactRepository);
  private datePipe = new DatePipe('id-ID');

  @ViewChild('islandPath') private islandPathRef?: ElementRef<SVGPathElement>;
  @ViewChildren('tentangTabBtn') private tentangTabBtnRefs!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('newsTrack') private newsTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('booksTrack') private booksTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('goodsTrack') private goodsTrackRef?: ElementRef<HTMLElement>;

  news = signal<News[]>([]);
  articles = signal<Article[]>([]);
  catalogBooks = signal<CatalogBook[]>([]);
  /** .pustaka-carousel dirender terbalik (buku terakhir di kiri, buku
   *  PERTAMA di kanan) — panel hijau ada di kanan, jadi biar buku pertama
   *  yang nempel/menimpa panel (posisi "langsung kelihatan" tanpa geser,
   *  mirror dari Berita di mana berita pertama yang nempel ke panel kiri),
   *  urutan tampil harus dibalik dari urutan data. Scroll awal juga
   *  di-set ke ujung kanan (lihat setCatalogBooks) supaya buku pertama itu
   *  yang kelihatan di rest position, bukan resting di tengah daftar. */
  catalogBooksForCarousel = computed(() => [...this.catalogBooks()].reverse());
  events = signal<EventListItem[]>([]);
  goods = signal<Goods[]>([]);
  schedulePeriodLabel = signal('');
  scheduleWeeks = signal<CalendarCell[][]>([]);
  /** Popup hover desktop (pola sama seperti previewIso di /jadwal index). */
  schedulePopupIso = signal<string | null>(null);
  /** Sheet mobile-only, tap tanggal kalender (lihat onScheduleCellClick()). */
  daySheet = signal<CalendarCell | null>(null);
  campaigns = signal<Campaign[]>([]);
  campaignStats = signal<CampaignPublicStats | null>(null);
  galleryFeature = signal<GalleryFeature | null>(null);
  /** Overlay zoom foto (app-gallery-lightbox, dipakai ulang dari halaman
   *  detail galeri) dan lightbox video YouTube — keduanya di-drive langsung
   *  dari kartu "Dokumentasi Kegiatan Terbaru", tidak lewat previewSheet
   *  generik karena kontennya (mosaic foto + video) jauh lebih kaya dari
   *  bentuk CardPreview lintas-modul. */
  galleryZoomOpen = signal(false);
  galleryZoomIndex = signal(0);
  galleryVideoOpen = signal(false);

  /** Form "Hubungi Kami" terpasang langsung di beranda (ala ldksyahid-app
   *  home partial contact-us) — logic/validator SAMA PERSIS dengan
   *  ContactPublicIndexPage (/tentang/kontak) supaya perilaku kedua form
   *  konsisten, cuma tanpa notice-card/newsletter/social-links di sini
   *  (di luar scope kartu ringkas beranda, sudah ada di halaman penuh). */
  contactForm = this.fb.group({
    senderName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });
  contactSubmitted = signal(false);
  contactRateLimited = signal(false);
  contactSubmitTried = signal(false);
  /** Diinisialisasi ke default migration (0041_contact_email_setting) —
   *  supaya tidak sempat kosong sebelum GET /public/settings/contact-email
   *  selesai, lihat setContactEmail(). */
  contactEmail = signal('fsldkindonesia29@gmail.com');

  loading = signal(true);

  readonly catalogbookPath = catalogbookPath;
  readonly eventPath = eventPath;
  readonly goodsPath = goodsPath;
  readonly schedulePath = schedulePath;
  readonly kantongAmalPath = kantongAmalPath;
  readonly newsPath = newsPath;
  readonly articlePath = articlePath;
  readonly statisticPath = statisticPath;
  readonly formatRupiah = formatRupiah;
  readonly scheduleDow = DAYS_ID_SHORT;
  readonly scheduleCategoryMeta = scheduleCategoryMeta;
  readonly scheduleTimeRange = scheduleTimeRange;
  readonly scheduleLongDate = scheduleLongDate;

  readonly missionList: MissionItem[] = [
    { no: '01', icon: 'fingerprint', text: 'Membangkitkan kembali identitas Islam pada mahasiswa muslim dan masyarakat.' },
    { no: '02', icon: 'book-open', text: 'Mengokohkan fikrah dan syariat Islam untuk melahirkan khoiru ummah.' },
    { no: '03', icon: 'flag', text: 'Membangkitkan jiwa nasionalisme dan patriotisme.' },
    { no: '04', icon: 'share-nodes', text: 'Membangun, menjaga, dan mengelola jaringan.' },
    { no: '05', icon: 'briefcase', text: 'Membangun profesionalitas lembaga.' },
    { no: '06', icon: 'venus', text: 'Membentuk dan mengakselerasi kemuslimahan nasional.' },
    { no: '07', icon: 'coins', text: 'Mewujudkan lembaga yang mandiri secara finansial.' },
  ];
  /** Amplop surat misi — pengganti grid kartu khusus mobile (lihat breakpoint
   *  di CSS .misi-envelope). Ketuk amplop membuka app-bottom-sheet kedua yang
   *  isinya carousel 1 misi per slide (panah/kiri-kanan), bukan bottom sheet
   *  generik previewSheet (bentuk datanya beda: carousel butuh index+arah,
   *  bukan chip/title/metaLines). misiDirection dipakai murni untuk memilih
   *  arah animasi slide-masuk konten (lihat @for key-trick di template yang
   *  memaksa Angular re-render elemen tiap ganti index, supaya animation
   *  CSS-nya replay). */
  misiSheetOpen = signal(false);
  misiActiveIndex = signal(0);
  misiDirection = signal<'next' | 'prev'>('next');

  openMisiSheet(): void {
    this.misiActiveIndex.set(0);
    this.misiSheetOpen.set(true);
  }

  closeMisiSheet(): void {
    this.misiSheetOpen.set(false);
  }

  nextMisi(): void {
    this.misiDirection.set('next');
    this.misiActiveIndex.update((i) => (i + 1) % this.missionList.length);
  }

  prevMisi(): void {
    this.misiDirection.set('prev');
    this.misiActiveIndex.update((i) => (i - 1 + this.missionList.length) % this.missionList.length);
  }

  readonly orgStructure: OrgMember[] = [
    { memberName: 'Puskomnas', position: 'Pusat Komunikasi Nasional — LDK koordinator tertinggi FSLDK Indonesia, dipilih dalam FSLDKN untuk masa kerja 2 tahun.', level: 'Nasional', icon: 'landmark' },
    { memberName: 'BK Puskomnas', position: 'Badan Khusus Puskomnas — LDK yang ditunjuk untuk kerja khusus (Hubungan Internasional, Kebangsaan, Kemanusiaan, Kemuslimahan, Kepalestinaan).', level: 'Nasional', icon: 'shield-check' },
    { memberName: 'Puskomda', position: 'Pusat Komunikasi Daerah — LDK koordinator FSLDK tingkat daerah, dipilih dalam musyawarah daerah untuk masa kerja 2 tahun.', level: 'Daerah', icon: 'building-2' },
    { memberName: 'LDK', position: 'Lembaga Dakwah Kampus — menaungi aktivitas dakwah Islam secara legal dan formal di perguruan tinggi.', level: 'Kampus', icon: 'mosque' },
    { memberName: 'ADK', position: 'Aktivis Dakwah Kampus — individu muslim berstatus mahasiswa yang berperan dalam aktivitas dakwah kampus.', level: 'Individu', icon: 'user-check' },
    { memberName: 'IKA FSLDK', position: 'Ikatan Keluarga Alumni FSLDK — wadah berhimpun alumni aktivis dakwah kampus.', level: 'Alumni', icon: 'award' },
  ];
  /** Puskomnas jadi satu-satunya "pusat" di puncak (bukan sejajar dengan BK
   *  Puskomnas) — sisanya jadi kartu turunan di grid bawahnya, mengikuti
   *  pola hub+grid #tab-keluarga di ldksyahid-app. */
  readonly orgHub = this.orgStructure[0];
  readonly orgHubSubtitle = this.orgHub.position.split('—')[0].trim();
  readonly orgBranches = this.orgStructure.slice(1);

  readonly foundedYear = 1986;
  readonly yearsSinceFounding = new Date().getFullYear() - this.foundedYear;

  readonly tentangTabs: { key: 'overview' | 'visi' | 'misi' | 'struktur'; icon: string; label: string }[] = [
    { key: 'overview', icon: 'info', label: 'Tentang' },
    { key: 'visi', icon: 'compass', label: 'Visi' },
    { key: 'misi', icon: 'list-checks', label: 'Misi' },
    { key: 'struktur', icon: 'sitemap', label: 'Struktur' },
  ];
  activeTentangTab = signal<'overview' | 'visi' | 'misi' | 'struktur'>('overview');
  /** Posisi/lebar pil aksen yang "meluncur" di bawah tab aktif — dihitung dari
   *  offsetLeft/offsetWidth tombol asli (bukan persentase tetap), mengikuti
   *  pola tabs-cr-slider di ldksyahid-app (about/index.blade.php) karena
   *  label tiap tab beda panjang. Dihitung ulang tiap ganti tab & saat resize. */
  tabSliderLeft = signal(0);
  tabSliderWidth = signal(0);

  selectTentangTab(key: 'overview' | 'visi' | 'misi' | 'struktur'): void {
    this.activeTentangTab.set(key);
    this.updateTentangTabSlider();
  }

  private updateTentangTabSlider(): void {
    const index = this.tentangTabs.findIndex((t) => t.key === this.activeTentangTab());
    const btn = this.tentangTabBtnRefs?.get(index)?.nativeElement;
    if (!btn) return;
    this.tabSliderLeft.set(btn.offsetLeft);
    this.tabSliderWidth.set(btn.offsetWidth);
  }

  @HostListener('window:resize')
  onTentangTabsResize(): void {
    this.updateTentangTabSlider();
  }

  /** Kutipan Al-Qur'an/Hadits statis — dipilih supaya nyambung langsung
   *  dengan pesan hero ("Menyatukan Langkah Dakwah Kampus se-Indonesia" /
   *  forum silaturahmi & koordinasi LDK, merawat ukhuwah, membina kader,
   *  menggerakkan dakwah yang terpadu dan kompak), bukan kutipan ukhuwah
   *  generik. Terjemahan Indonesia saja (tanpa teks Arab). Sumber dicantumkan
   *  supaya bisa diverifikasi; terjemahan mengikuti versi yang umum dikutip,
   *  bukan salinan verbatim satu penerbit tertentu. */
  readonly heroQuotes: { text: string; source: string }[] = [
    {
      text: 'Dan berpegang teguhlah kamu semuanya pada tali (agama) Allah, dan janganlah kamu bercerai berai. Ingatlah nikmat Allah kepadamu ketika dahulu kamu bermusuh-musuhan, lalu Allah mempersatukan hatimu sehingga dengan karunia-Nya kamu menjadi bersaudara.',
      source: 'QS. Ali ‘Imran: 103',
    },
    {
      text: 'Dan hendaklah ada di antara kamu segolongan umat yang menyeru kepada kebajikan, menyuruh kepada yang ma’ruf, dan mencegah dari yang munkar. Merekalah orang-orang yang beruntung.',
      source: 'QS. Ali ‘Imran: 104',
    },
    {
      text: 'Sesungguhnya Allah menyukai orang-orang yang berjuang di jalan-Nya dalam barisan yang teratur, seakan-akan mereka seperti suatu bangunan yang tersusun kokoh.',
      source: 'QS. Ash-Shaff: 4',
    },
    {
      text: 'Dan tolong-menolonglah kamu dalam (mengerjakan) kebajikan dan takwa, dan jangan tolong-menolong dalam berbuat dosa dan pelanggaran.',
      source: 'QS. Al-Ma’idah: 2',
    },
    {
      text: 'Serulah (manusia) kepada jalan Tuhanmu dengan hikmah dan pelajaran yang baik, dan berdebatlah dengan mereka dengan cara yang lebih baik.',
      source: 'QS. An-Nahl: 125',
    },
    {
      text: 'Siapakah yang lebih baik perkataannya daripada orang yang menyeru kepada Allah, mengerjakan amal saleh, dan berkata, “Sesungguhnya aku termasuk orang-orang muslim”?',
      source: 'QS. Fussilat: 33',
    },
    {
      text: 'Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu yang berselisih dan bertakwalah kepada Allah agar kamu mendapat rahmat.',
      source: 'QS. Al-Hujurat: 10',
    },
    {
      text: 'Dan orang-orang yang beriman, laki-laki dan perempuan, sebagian mereka menjadi penolong bagi sebagian yang lain. Mereka menyuruh mengerjakan yang ma’ruf, mencegah dari yang munkar.',
      source: 'QS. At-Taubah: 71',
    },
    {
      text: 'Wahai orang-orang yang beriman! Masuklah ke dalam Islam secara keseluruhan (kaffah), dan janganlah kamu ikuti langkah-langkah setan.',
      source: 'QS. Al-Baqarah: 208',
    },
    {
      text: 'Dan taatlah kepada Allah dan Rasul-Nya, dan janganlah kamu berbantah-bantahan yang menyebabkan kamu menjadi gentar dan hilang kekuatanmu, dan bersabarlah. Sesungguhnya Allah beserta orang-orang yang sabar.',
      source: 'QS. Al-Anfal: 46',
    },
    {
      text: 'Sampaikanlah dariku walau satu ayat.',
      source: 'HR. Bukhari, dari Abdullah bin Amr bin Ash',
    },
    {
      text: 'Sebaik-baik kalian adalah yang mempelajari Al-Qur’an dan mengajarkannya.',
      source: 'HR. Bukhari, dari Utsman bin Affan',
    },
    {
      text: 'Perumpamaan orang-orang mukmin dalam hal saling mencintai, saling menyayangi, dan saling melindungi mereka adalah seperti satu tubuh. Apabila salah satu anggota tubuh mengeluh sakit, maka seluruh tubuh lainnya turut merasakan, hingga tidak bisa tidur dan demam.',
      source: 'HR. Bukhari dan Muslim, dari Nu’man bin Basyir',
    },
    {
      text: 'Seorang mukmin bagi mukmin lainnya seperti sebuah bangunan yang sebagiannya menguatkan sebagian yang lain.',
      source: 'HR. Bukhari dan Muslim, dari Abu Musa Al-Asy’ari',
    },
    {
      text: 'Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga.',
      source: 'HR. Muslim, dari Abu Hurairah',
    },
    {
      text: 'Barangsiapa merintis dalam Islam suatu kebiasaan yang baik, maka ia mendapat pahalanya dan pahala orang-orang yang mengamalkannya setelah itu, tanpa mengurangi sedikit pun pahala mereka.',
      source: 'HR. Muslim, dari Jarir bin Abdullah',
    },
    {
      text: 'Barangsiapa menunjukkan kepada kebaikan, maka ia akan mendapat pahala seperti pahala orang yang mengerjakannya.',
      source: 'HR. Muslim, dari Abu Mas’ud Al-Anshari',
    },
  ];
  /** Dipilih acak sekali saat komponen dibuat (bukan interval) — kutipan
   *  hanya berganti saat halaman dimuat ulang (refresh/navigasi ulang),
   *  bukan otomatis berputar sendiri. */
  quoteIndex = signal(Math.floor(Math.random() * this.heroQuotes.length));
  activeQuote = computed(() => this.heroQuotes[this.quoteIndex()]);

  /** Data 7 simpul peta jaringan — satu sumber untuk dua hal sekaligus: (1)
   *  render <circle> ping+node lewat @for di template (menggantikan 14 blok
   *  markup yang tadinya diulang manual), (2) posisi tooltip custom (lihat
   *  hoveredNode di bawah), karena leftPct/topPct dihitung dari cx/cy yang
   *  sama persis (cx/640*100, cy/240*100 sesuai viewBox svg). Tooltip custom
   *  ini menggantikan <title> bawaan browser (kotak hitam polos) yang kurang
   *  bagus tampilannya. */
  readonly heroMapNodes: { cx: number; cy: number; r: number; colorClass: '' | 'gold' | 'ember'; nodeDelay: string; pingDelay: string; label: string; leftPct: number; topPct: number }[] = [
    { cx: 217.6, cy: 190.1, r: 15, colorClass: '', nodeDelay: '0s', pingDelay: '0s', label: 'Puskomnas FSLDK Indonesia — Yogyakarta', leftPct: 34.0, topPct: 79.2 },
    { cx: 62.5, cy: 38.8, r: 11, colorClass: 'gold', nodeDelay: '.2s', pingDelay: '.7s', label: 'Simpul jaringan — Medan, Sumatera', leftPct: 9.8, topPct: 16.2 },
    { cx: 204, cy: 86.8, r: 10, colorClass: 'ember', nodeDelay: '.5s', pingDelay: '1.4s', label: 'Simpul jaringan — Pontianak, Kalimantan', leftPct: 31.9, topPct: 36.2 },
    { cx: 281.9, cy: 201.6, r: 8, colorClass: '', nodeDelay: '.7s', pingDelay: '2.1s', label: 'Simpul jaringan — Denpasar, Bali', leftPct: 44.0, topPct: 84.0 },
    { cx: 337.8, cy: 154.8, r: 10, colorClass: 'gold', nodeDelay: '.3s', pingDelay: '.4s', label: 'Simpul jaringan — Makassar, Sulawesi', leftPct: 52.8, topPct: 64.5 },
    { cx: 453.8, cy: 135.5, r: 9, colorClass: 'ember', nodeDelay: '.9s', pingDelay: '1.8s', label: 'Simpul jaringan — Ambon, Maluku', leftPct: 70.9, topPct: 56.5 },
    { cx: 620, cy: 120.1, r: 11, colorClass: '', nodeDelay: '.6s', pingDelay: '2.5s', label: 'Simpul jaringan — Jayapura, Papua', leftPct: 96.9, topPct: 50.0 },
  ];
  hoveredNode = signal<(typeof this.heroMapNodes)[number] | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  ngAfterViewInit(): void {
    this.animateIslandPath();
    setTimeout(() => this.updateTentangTabSlider());
  }

  /** Efek "peta digambar sendiri" — stroke di-dash sepanjang total panjang
   *  path (dihitung via getTotalLength(), bukan angka tebakan, supaya presisi
   *  berapa pun kompleksnya path-nya), lalu dashoffset dianimasikan dari
   *  panjang penuh ke 0 lewat Web Animations API. Dihormati prefers-reduced-
   *  motion — langsung tampil penuh tanpa animasi kalau user memintanya. */
  private animateIslandPath(): void {
    const path = this.islandPathRef?.nativeElement;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      path.style.strokeDashoffset = '0';
      return;
    }
    path.animate(
      [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
      { duration: 1400, easing: 'ease-out', fill: 'forwards' },
    );
  }

  progressPercent(c: Campaign): number {
    return c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0;
  }

  /** Rotasi 3 warna aksen per-kartu — redesign "Karya Tulis Kita" ala
   *  ldksyahid-app (resources/views/landing-page/home/partials/article,
   *  $cardColors di-index dengan $key % count). Diganti dari trio generic
   *  (indigo/teal/amber) ke trio warna base brand yang sama dipakai
   *  chip-green/chip-ember/chip-gold & node peta hero (styles.scss) —
   *  tetap 3 warna berbeda per-kartu, tapi konsisten dengan palet FSLDK. */
  private readonly articleAccents = ['var(--color-primary)', 'var(--color-ember)', 'var(--color-gold)'];
  articleAccent(index: number): string {
    return this.articleAccents[index % this.articleAccents.length];
  }

  formatDate(d: string | Date | null | undefined): string {
    return d ? (this.datePipe.transform(d, 'd MMM yyyy') ?? '') : '';
  }

  /** Nama hari + jam untuk kartu carousel Berita (mis. "Kamis" / "14.26") —
   *  formatDate() di atas dipertahankan apa adanya (dipakai luas di tempat
   *  lain), dua helper ini murni tambahan untuk tampilan carousel baru. */
  formatDayName(d: string | Date | null | undefined): string {
    return d ? (this.datePipe.transform(d, 'EEEE') ?? '') : '';
  }

  formatTime(d: string | Date | null | undefined): string {
    return d ? (this.datePipe.transform(d, 'HH.mm') ?? '') : '';
  }

  /** Rentang tanggal kartu Event — "23 Nov 2026" untuk event sehari, atau
   *  "23 – 25 Nov 2026" kalau startDate/endDate beda hari (event multi-hari),
   *  data yang tadinya tidak dipakai sama sekali di kartu ringkas. */
  eventDateRange(e: EventListItem): string {
    if (!e.startDate) return '';
    if (!e.endDate || new Date(e.startDate).toDateString() === new Date(e.endDate).toDateString()) {
      return this.formatDate(e.startDate);
    }
    const start = this.datePipe.transform(e.startDate, 'd MMM') ?? '';
    const end = this.datePipe.transform(e.endDate, 'd MMM yyyy') ?? '';
    return `${start} – ${end}`;
  }

  /** Kota + venue digabung — pola sama seperti event.public-detail.page.html
   *  ("Yogyakarta — Hotel Grand Keisha…"). */
  eventLocationText(e: EventListItem): string {
    if (e.location && e.place) return `${e.location} — ${e.place}`;
    return e.location || e.place || '';
  }

  /** Label status pendaftaran yang lebih detail (dipakai di sheet mobile,
   *  lihat eventPreview()) — chip di kartu sendiri tetap versi singkatnya
   *  (lihat template, langsung inline karena cuma dua kata). */
  eventRegistLabel(e: EventListItem): string {
    if (e.status === 'upcoming') {
      if (e.registOpen) {
        return e.closeRegistDate ? `Dibuka hingga ${this.formatDate(e.closeRegistDate)}` : 'Pendaftaran Dibuka';
      }
      return 'Pendaftaran Ditutup';
    }
    return e.status === 'ongoing' ? 'Sedang Berlangsung' : 'Sudah Selesai';
  }

  /** Bentuk CardPreview generik (lihat definisi interface di atas) untuk
   *  kartu Event — dipakai openPreview() supaya tap kartu di mobile membuka
   *  bottom sheet konsisten dengan Berita/Artikel/Buku, bukan langsung
   *  pindah halaman. */
  eventPreview(e: EventListItem): CardPreview {
    const metaRows: CardPreviewMetaRow[] = [{ icon: 'calendar', label: 'Tanggal', value: this.eventDateRange(e) }];
    const locationText = this.eventLocationText(e);
    if (locationText) metaRows.push({ icon: 'map-pin', label: 'Lokasi', value: locationText });
    metaRows.push({
      icon: e.status === 'upcoming' ? (e.registOpen ? 'check-circle' : 'x-circle') : 'clock',
      label: 'Status',
      value: this.eventRegistLabel(e),
    });
    if (e.tag) metaRows.push({ icon: 'hash', label: 'Kategori', value: e.tag });
    return {
      chip: e.eventDivision,
      title: e.eventTitle,
      metaLines: [],
      metaRows,
      link: eventPath.publicDetail(e.eventSlug),
      ctaLabel: 'Lihat Detail Event',
      image: e.eventImage,
    };
  }

  /** Mobile-only preview: klik kartu berita/artikel/campaign membuka bottom
   *  sheet ringkas (bukan langsung pindah halaman) — sesuai revamp-project
   *  prompt poin 9. Desktop tidak diganggu, routerLink jalan seperti biasa. */
  previewSheet = signal<CardPreview | null>(null);

  openPreview(event: Event, preview: CardPreview): void {
    if (window.innerWidth > 720) return;
    event.preventDefault();
    this.previewSheet.set(preview);
  }

  /** RouterLink.onClick() selalu memanggil router.navigateByUrl() begitu
   *  urlTree-nya tidak null — TIDAK peduli event.preventDefault() sudah
   *  dipanggil handler (click) lain di elemen yang sama (lihat openPreview
   *  di atas). Makanya kartu tetap lompat ke detail meski preventDefault
   *  jalan. Fix: [routerLink] di-null-kan di mobile supaya RouterLink
   *  sendiri yang urung navigasi (early-return saat urlTree === null),
   *  bukan mengandalkan preventDefault dari handler lain. */
  isMobilePreview(): boolean {
    return window.innerWidth <= 720;
  }

  goToPreview(): void {
    const link = this.previewSheet()?.link;
    this.previewSheet.set(null);
    if (!link) return;
    if (Array.isArray(link)) this.router.navigate(link);
    else this.router.navigateByUrl(link);
  }

  /** Panah kiri/kanan carousel Berita (desktop) — geser satu "layar" track
   *  (80% lebarnya) alih-alih per-kartu, supaya tetap terasa proporsional
   *  berapa pun lebar kartu hasil resize. scrollBy bawaan browser yang
   *  menganimasikan (scroll-behavior:smooth di CSS), bukan animasi manual. */
  scrollNews(direction: 1 | -1): void {
    const track = this.newsTrackRef?.nativeElement;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  }

  /** Sama seperti scrollNews() — carousel Perpustakaan (mirror horizontal
   *  Berita, lihat .pustaka-carousel di atas). */
  scrollBooks(direction: 1 | -1): void {
    const track = this.booksTrackRef?.nativeElement;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  }

  /** Sama seperti scrollNews()/scrollBooks() — carousel FSLDK Goods. */
  scrollGoods(direction: 1 | -1): void {
    const track = this.goodsTrackRef?.nativeElement;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  }

  /** Bentuk CardPreview untuk kartu Goods — sheet mobile-nya ikut
   *  menampilkan harga, status ketersediaan, dan strip previewImages
   *  (lihat p.gallery di template sheet). */
  goodsPreview(g: Goods): CardPreview {
    const metaRows: CardPreviewMetaRow[] = [{ icon: 'coins', label: 'Harga', value: this.formatRupiah(g.price) }];
    if (g.availabilityStatus !== 'available') {
      metaRows.push({
        icon: g.availabilityStatus === 'out_of_stock' ? 'x-circle' : 'clock',
        label: 'Ketersediaan',
        value: g.availabilityStatus === 'out_of_stock' ? 'Stok Habis' : 'Segera Hadir',
      });
    }
    return {
      chip: g.categoryName,
      title: g.goodsName,
      metaLines: [],
      metaRows,
      link: goodsPath.publicDetail(g.goodsSlug),
      ctaLabel: 'Lihat Produk',
      image: g.mainImageUrl,
      excerpt: g.shortDescription,
      gallery: g.previewImages,
    };
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }

  /** Root cause dari "kartu pertama mepet ke panel hijau di mobile" — BUKAN
   *  soal margin/padding kurang. Chromium punya quirk: scroll container yang
   *  punya `padding` + child `scroll-snap-align:start` auto-rest scrollLeft
   *  = padding-left begitu konten pertama kali dirender (snap area
   *  memasukkan padding, jadi browser "mengoreksi" ke snap point terdekat
   *  yang kebetulan persis di ujung padding) — visual efeknya persis seperti
   *  padding-left itu tidak pernah ada. rAF dipakai (bukan setTimeout 0)
   *  supaya jalan setelah browser selesai layout+auto-snap pasca render
   *  @for kartu, bukan berlomba dengannya. */
  setNews(news: News[]): void {
    this.news.set(news);
    requestAnimationFrame(() => {
      const track = this.newsTrackRef?.nativeElement;
      if (track) track.scrollLeft = 0;
    });
  }
  setArticles(articles: Article[]): void { this.articles.set(articles); }

  /** Rest position di-set ke ujung KANAN (scrollWidth - clientWidth), bukan
   *  0 — track dirender terbalik (lihat catalogBooksForCarousel) supaya
   *  buku pertama jatuh di kanan (nempel panel hijau yang juga di kanan).
   *  Tanpa ini, resting position default (0) malah nampilin buku
   *  TERAKHIR dulu (kiri), buku pertama baru kelihatan setelah discroll. */
  setCatalogBooks(books: CatalogBook[]): void {
    this.catalogBooks.set(books);
    requestAnimationFrame(() => {
      const track = this.booksTrackRef?.nativeElement;
      if (track) track.scrollLeft = track.scrollWidth - track.clientWidth;
    });
  }
  setEvents(events: EventListItem[]): void { this.events.set(events); }
  setGoods(goods: Goods[]): void { this.goods.set(goods); }
  setSchedulePeriodLabel(label: string): void { this.schedulePeriodLabel.set(label); }
  setScheduleWeeks(weeks: CalendarCell[][]): void { this.scheduleWeeks.set(weeks); }

  openSchedulePopup(iso: string): void { this.schedulePopupIso.set(iso); }
  closeSchedulePopup(): void { this.schedulePopupIso.set(null); }

  /** Klik tanggal kalender Jadwal — mobile buka bottom sheet (tidak ada
   *  hover di touch device). Desktop SENGAJA cuma "pastikan terbuka", BUKAN
   *  toggle — hover (mouseenter/mouseleave) sudah pegang buka/tutupnya;
   *  kalau klik juga toggle, klik di kartu yang popup-nya lagi kebuka via
   *  hover malah langsung MENUTUPNYA (bug yang dilaporkan user). */
  onScheduleCellClick(cell: CalendarCell): void {
    if (!cell.items.length) return;
    if (this.isMobilePreview()) { this.daySheet.set(cell); return; }
    this.schedulePopupIso.set(cell.iso);
  }

  setCampaigns(campaigns: Campaign[]): void { this.campaigns.set(campaigns); }
  setCampaignStats(stats: CampaignPublicStats | null): void { this.campaignStats.set(stats); }

  /** Angka besar di stat card ("Rp 12,5 Jt") — beda dari formatRupiah()
   *  (dipakai kartu campaign, butuh nominal presisi penuh), stat card
   *  butuh angka ringkas ala "1000+ Anggota Aktif" di ldksyahid-app. */
  formatCompactRupiah(amount: number): string {
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} M`;
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} Jt`;
    return formatRupiah(amount);
  }
  setGalleryFeature(feature: GalleryFeature | null): void { this.galleryFeature.set(feature); }
  setContactEmail(email: string): void { this.contactEmail.set(email); }

  openGalleryZoom(index: number): void {
    this.galleryZoomIndex.set(index);
    this.galleryZoomOpen.set(true);
  }
  closeGalleryZoom(): void { this.galleryZoomOpen.set(false); }

  openGalleryVideo(): void { this.galleryVideoOpen.set(true); }
  closeGalleryVideo(): void { this.galleryVideoOpen.set(false); }

  safeGalleryVideoUrl(videoID: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoID}?autoplay=1&rel=0`);
  }

  /** eventDescription diisi lewat app-rich-text-editor di CMS (lihat
   * gallery.form.page.html) — jadi legitimately berisi tag HTML, sama seperti
   * di gallery.public-detail.page.ts. Interpolasi biasa {{ }} akan meng-escape
   * tag-nya jadi teks mentah, makanya butuh innerHTML + sanitizer di sini. */
  sanitizeGalleryDescription(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** Sama seperti imgUrl() di gallery.public-index/detail.page.ts — path foto
   *  galeri disimpan relatif (butuh di-prefix apiBaseUrl), beda dari gambar
   *  modul lain di beranda ini yang sudah dikirim backend sebagai URL utuh. */
  galleryImgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    return path.startsWith('/') ? `${base}${path}` : `${base}/uploads/${path}`;
  }

  contactHasError(field: 'senderName' | 'email' | 'subject' | 'message'): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.invalid && (control.touched || this.contactSubmitTried()));
  }

  onContactSubmit(): void {
    this.contactSubmitTried.set(true);
    if (this.contactForm.invalid) {
      this.toast.error('Mohon lengkapi seluruh field dengan benar.');
      return;
    }

    const payload = {
      senderName: this.contactForm.value.senderName!.trim(),
      email: this.contactForm.value.email!.trim(),
      subject: this.contactForm.value.subject!.trim(),
      message: this.contactForm.value.message!.trim(),
    };

    this.contactRepo.sendPublic(payload).subscribe({
      next: () => {
        this.contactSubmitted.set(true);
        this.contactRateLimited.set(false);
        this.toast.success('Pesan Anda berhasil dikirim!');
      },
      error: (err) => {
        if (err.status === 429) {
          this.contactRateLimited.set(true);
          this.toast.warning('Terlalu banyak permintaan pengiriman pesan. Coba lagi beberapa saat lagi.');
        } else {
          this.toast.error(err.error?.message || 'Gagal mengirim pesan. Silakan coba kembali.');
        }
      },
    });
  }

  resetContactForm(): void {
    this.contactForm.reset();
    this.contactSubmitTried.set(false);
    this.contactSubmitted.set(false);
  }
}
