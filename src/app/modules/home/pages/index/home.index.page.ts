import { AfterViewInit, Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../../../shared/icon.component';
import { WelcomePopupComponent } from '../../components/welcome-popup.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { PopupModalComponent } from '../../../../shared/popup-modal.component';
import { News } from '../../../news/entities/news';
import { Article } from '../../../article/entities/article';
import { CatalogBook } from '../../../catalogbook/entities/catalog-book';
import { EventListItem } from '../../../event/entities/event';
import { Goods } from '../../../goods/entities/goods';
import { Schedule } from '../../../schedule/entities/schedule';
import { Campaign } from '../../../kantong-amal/entities/campaign';
import { GalleryListItem } from '../../../gallery/entities/gallery';
import { contactPath } from '../../../contact/contact.path';
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
}

@Component({
  selector: 'app-home-index-page',
  standalone: true,
  templateUrl: './home.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, WelcomePopupComponent, BottomSheetComponent, PopupModalComponent],
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
      color: #fff; padding: 10px 20px; border-radius: var(--radius-full); font-weight: 700; font-size: .76rem;
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
      color: #fff; padding: 10px 20px; border-radius: var(--radius-full); font-weight: 700; font-size: .76rem;
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

    /* ---------- Artikel: "kartu kajian" — teks-sentris (tanpa foto dominan
       seperti Berita), aksen batang warna emas di kiri + excerpt
       (articleIntro) + identitas penulis, kesan lebih tenang/reflektif
       dibanding sorotan berita yang bergambar. ---------- */
    .artikel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .artikel-card {
      position: relative; display: block; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 26px 24px 22px 28px; overflow: hidden;
      transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out), border-color var(--motion-fast) ease;
    }
    .artikel-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); text-decoration: none; border-color: var(--color-gold-soft); }
    .artikel-card-accent { position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background: linear-gradient(var(--color-gold), var(--color-gold-dark)); }
    .artikel-card h3 { margin: 12px 0 10px; font-size: 1.1rem; line-height: 1.35; }
    .artikel-intro { margin: 0 0 18px; color: var(--color-text-secondary); font-size: .88rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .artikel-writer { display: flex; align-items: center; gap: 10px; font-size: .8rem; color: var(--color-muted); font-weight: 600; }
    .artikel-writer-avatar { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--color-gold-soft); color: var(--color-gold-dark); font-weight: 800; font-size: .8rem; }
    @media (max-width: 900px) { .artikel-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .artikel-grid { grid-template-columns: 1fr; } }

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

    /* ---------- Event card: "poster" — foto penuh + overlay gradasi bawah
       menampung judul/lokasi (bukan lagi thumb+body terpisah seperti kartu
       lain), badge tanggal mengambang gaya agenda-mini-date, chip status
       (Akan Datang/Berlangsung/Selesai) di sudut kanan. ---------- */
    .event-card {
      position: relative; display: block; aspect-ratio: 3/4; border-radius: var(--radius-lg); overflow: hidden;
      box-shadow: var(--shadow-sm); transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    .event-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); text-decoration: none; }
    .event-card-media { position: relative; width: 100%; height: 100%; background: var(--color-primary-soft); }
    .event-card-media img { width: 100%; height: 100%; object-fit: cover; }
    .event-card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(4,20,10,.88) 0%, rgba(4,20,10,.2) 55%, transparent 75%);
    }
    .event-date-badge {
      position: absolute; top: 14px; left: 14px; display: flex; flex-direction: column; align-items: center;
      background: #fff; border-radius: 12px; padding: 6px 10px; box-shadow: var(--shadow-sm); line-height: 1;
    }
    .event-date-badge .day { font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; color: var(--color-primary-dark); }
    .event-date-badge .mon { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .event-status-chip {
      position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,.92); color: var(--color-primary-dark);
      font-size: .7rem; font-weight: 800; padding: 4px 10px; border-radius: var(--radius-full);
    }
    .event-status-chip.ongoing { background: var(--color-gold); color: #fff; }
    .event-status-chip.past { background: rgba(255,255,255,.7); color: var(--color-muted); }
    .event-card-caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px; color: #fff; }
    .event-card-caption .chip { margin-bottom: 8px; }
    .event-card-caption h3 { color: #fff; margin: 0 0 6px; font-size: 1.05rem; line-height: 1.3; }
    .event-card-location { display: flex; align-items: center; gap: 5px; margin: 0; font-size: .78rem; color: rgba(255,255,255,.85); }

    /* ---------- Goods card: overlay hover berisi shortDescription + CTA
       (data yang tadinya tidak dipakai sama sekali di kartu ringkas
       beranda), ribbon "Unggulan" diagonal untuk isFeatured, badge stok
       untuk availabilityStatus selain 'available'. ---------- */
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
    .goods-card2-overlay {
      position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; padding: 16px;
      background: linear-gradient(to top, rgba(4,55,26,.92) 0%, transparent 62%); color: #fff;
      opacity: 0; transform: translateY(8px); transition: opacity var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) { .goods-card2:hover .goods-card2-overlay { opacity: 1; transform: translateY(0); } }
    .goods-card2-overlay p { margin: 0; font-size: .8rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .goods-card2-cta { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; font-weight: 800; }
    .goods-card2-price { display: block; margin-top: 10px; font-weight: 800; color: var(--color-primary-dark); font-size: 1.05rem; }

    /* ---------- Campaign card: cincin progres melingkar (conic-gradient,
       tanpa chart lib) menggantikan bar linear + badge persen — progres jadi
       elemen visual utama yang lebih kuat, bar linear (.progress-track/
       .progress-fill/.progress-meta) tetap dipakai TERPISAH di bottom sheet
       preview mobile (openPreview), tidak dihapus. ---------- */
    .campaign-card2 { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .campaign-card2:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); text-decoration: none; }
    .campaign-card2-media { aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .campaign-card2-media img { width: 100%; height: 100%; object-fit: cover; }
    .campaign-card2-body { display: flex; align-items: center; gap: 16px; }
    .campaign-ring {
      --pct: 0; flex-shrink: 0; position: relative; width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center;
      background: conic-gradient(var(--color-gold) calc(var(--pct) * 1%), var(--color-primary-soft) 0);
    }
    .campaign-ring::before { content: ''; position: absolute; inset: 5px; border-radius: 50%; background: #fff; }
    .campaign-ring span { position: relative; z-index: 1; font-family: var(--font-heading); font-weight: 800; font-size: .82rem; color: var(--color-primary-dark); }
    .campaign-card2-info { min-width: 0; }
    .campaign-card2-info h3 { margin: 6px 0 4px; font-size: 1rem; }

    .agenda-mini-list { display: flex; flex-direction: column; gap: 14px; max-width: 760px; margin: 0 auto; }
    .agenda-mini-item { display: flex; gap: 18px; align-items: flex-start; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 20px; }
    .agenda-mini-date { flex-shrink: 0; width: 56px; text-align: center; border-right: 1px solid var(--color-border); padding-right: 16px; }
    .agenda-mini-date .day { display: block; font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--color-primary-dark); }
    .agenda-mini-date .mon { display: block; font-size: .75rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; }
    .agenda-mini-body h3 { margin: 6px 0 4px; font-size: 1.05rem; }

    .contact-cta-inner {
      max-width: 640px; margin: 0 auto; text-align: center; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-sm);
    }
    .contact-cta-inner p { max-width: 46ch; margin: 8px auto 20px; }

    .gallery-card { display: grid; grid-template-columns: 1.1fr 1fr; gap: 0; max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .gallery-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .gallery-thumb { aspect-ratio: 4/3; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; letter-spacing: .1em; }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-body { padding: 28px; display: flex; flex-direction: column; justify-content: center; }
    .gallery-body h3 { margin: 12px 0 8px; font-size: 1.3rem; }
    .gallery-count { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .85rem; margin-top: 10px; }
    @media (max-width: 640px) { .gallery-card { grid-template-columns: 1fr; } }

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
    .sheet-image { border-radius: 14px; overflow: hidden; margin: 0 0 14px; }
    .sheet-image img { display: block; width: 100%; height: 190px; object-fit: cover; object-position: center top; }
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
    /* Pil gradient (bukan lagi .btn-primary kotak) khusus tombol sheet —
       di-scope lokal ke elemen yang dirender komponen ini sendiri, pola sama
       seperti override .modal-pop di app-alert-dialog. */
    .sheet-cta {
      margin-top: 4px; justify-content: center; border: none; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary-dark)); box-shadow: var(--shadow-sm);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .sheet-cta:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

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
  private datePipe = new DatePipe('id-ID');

  @ViewChild('islandPath') private islandPathRef?: ElementRef<SVGPathElement>;
  @ViewChildren('tentangTabBtn') private tentangTabBtnRefs!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('newsTrack') private newsTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('booksTrack') private booksTrackRef?: ElementRef<HTMLElement>;

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
  schedules = signal<Schedule[]>([]);
  campaigns = signal<Campaign[]>([]);
  latestGallery = signal<GalleryListItem | null>(null);
  loading = signal(true);

  readonly catalogbookPath = catalogbookPath;
  readonly eventPath = eventPath;
  readonly goodsPath = goodsPath;
  readonly schedulePath = schedulePath;
  readonly kantongAmalPath = kantongAmalPath;
  readonly contactPath = contactPath;
  readonly newsPath = newsPath;
  readonly articlePath = articlePath;
  readonly statisticPath = statisticPath;
  readonly formatRupiah = formatRupiah;

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
  setSchedules(schedules: Schedule[]): void { this.schedules.set(schedules); }
  setCampaigns(campaigns: Campaign[]): void { this.campaigns.set(campaigns); }
  setLatestGallery(gallery: GalleryListItem | null): void { this.latestGallery.set(gallery); }
}
