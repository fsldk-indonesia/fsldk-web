import { Injectable } from '@angular/core';

export interface HadithQuranContent {
  arabic: string;
  translation: string;
  sourceLabel: string;
  numberLabel: string;
  isQuran: boolean;
}

interface HadithBook { id: string; name: string; max: number; }

// Enam kitab hadis populer + jumlah maksimum nomor hadisnya — dipakai untuk
// memilih hadis acak. Sumber data publik hadith-api-go.vercel.app.
const BOOKS: HadithBook[] = [
  { id: 'bukhari', name: 'HR. Bukhari', max: 6638 },
  { id: 'muslim', name: 'HR. Muslim', max: 4930 },
  { id: 'abu-daud', name: 'HR. Abu Daud', max: 4419 },
  { id: 'tirmidzi', name: 'HR. Tirmidzi', max: 3625 },
  { id: 'ibnu-majah', name: 'HR. Ibnu Majah', max: 4285 },
  { id: 'nasai', name: 'HR. Nasai', max: 5364 },
];

// Jumlah ayat per surah (index 0 = Al-Fatihah) — dipakai untuk memilih ayat
// Al-Qur'an acak dari quran-api-id.vercel.app (sumber publik, tanpa API key).
const SURAH_MAX_AYAH: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30,
  73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29,
  18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18,
  12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19,
  5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const FETCH_TIMEOUT_MS = 10000;

/**
 * Sumber tunggal untuk pengambilan hadis/ayat Al-Qur'an acak dari API publik
 * pihak ketiga — dipakai HadithQuranWidgetComponent (dashboard CMS) dan hero
 * Beranda publik, supaya logika pemilihan acak + pemanggilan API tidak
 * terduplikasi di dua tempat.
 *
 * Panggil `fetch` browser langsung ke API publik (BUKAN lewat ApiService) —
 * pola yang sama dipakai PrayerTimeComponent — supaya authInterceptor/
 * errorInterceptor global tidak ikut kena ke domain di luar backend sendiri.
 * Retry/backoff dan state UI (loading/failed) tetap tanggung jawab pemanggil,
 * karena berbeda-beda kebutuhannya per tempat pakai.
 */
@Injectable({ providedIn: 'root' })
export class HadithQuranService {
  fetchRandom(preferredType: 'hadith' | 'quran'): Promise<HadithQuranContent> {
    return preferredType === 'quran' ? this.fetchAyah() : this.fetchHadith();
  }

  private async fetchHadith(): Promise<HadithQuranContent> {
    const book = BOOKS[Math.floor(Math.random() * BOOKS.length)];
    const number = Math.floor(Math.random() * book.max) + 1;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`https://hadith-api-go.vercel.app/api/v1/hadis/${book.id}/${number}`, { signal: ctrl.signal });
      const json = await res.json();
      if (json?.status !== 'success' || !json?.data) throw new Error('invalid hadith response');
      return {
        arabic: json.data.arab ?? '',
        translation: json.data.id ?? '',
        sourceLabel: book.name,
        numberLabel: `${book.name} No. ${json.data.number}`,
        isQuran: false,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchAyah(): Promise<HadithQuranContent> {
    const surahNo = Math.floor(Math.random() * 114) + 1;
    const ayahNo = Math.floor(Math.random() * SURAH_MAX_AYAH[surahNo - 1]) + 1;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`https://quran-api-id.vercel.app/surah/${surahNo}/${ayahNo}`, { signal: ctrl.signal });
      const json = await res.json();
      if (json?.code !== 200 || !json?.data) throw new Error('invalid quran response');
      const d = json.data;
      const surahName = d.surah?.name?.transliteration?.id ? `QS. ${d.surah.name.transliteration.id}` : `QS. Surah ${surahNo}`;
      return {
        arabic: d.text?.arab ?? '',
        translation: d.translation?.id ?? '',
        sourceLabel: surahName,
        numberLabel: `${surahName}: ${ayahNo}`,
        isQuran: true,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
