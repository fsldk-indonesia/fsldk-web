import { Observable } from 'rxjs';
import { MultiSelectOption } from '../multi-select.component';

/** Satu kartu panduan di atas tabel — lihat guide-grid di CmsIndexComponent. */
export interface CmsGuideCard {
  icon: string;
  title: string;
  description: string;
}

/** Satu kolom tabel — dipakai untuk header sortable & daftar "Atur Kolom". */
export interface CmsColumnDef {
  /** Kunci sort (dikirim ke dataSource sebagai `sort`) SEKALIGUS kunci visibility
   *  "Atur Kolom" — kolom render sel-nya tetap tanggung jawab row template host
   *  (lihat isColumnVisible di context template), komponen ini cuma mengelola
   *  state-nya (tampil/sembunyi, arah sort aktif). */
  key: string;
  label: string;
  /** Default true — set false untuk kolom yang tidak masuk akal diurutkan
   *  (mis. kolom Aksi kalau suatu saat dimasukkan ke sini). */
  sortable?: boolean;
  /** Kolom terkunci selalu tampil, tidak muncul sebagai checkbox di "Atur
   *  Kolom" (biasanya kolom pertama/identitas baris, mis. Judul). */
  locked?: boolean;
}

export interface CmsComboboxOption {
  id: string | number;
  label: string;
}

export type CmsSearchTargetMode = 'text' | 'combobox';

/** Satu opsi di dropdown target-kolom pencarian (mis. Judul/Reporter/Kategori). */
export interface CmsSearchTargetDef {
  /** Dikirim sebagai kunci di CmsListParams.filters. */
  value: string;
  label: string;
  /** 'text' (default) = kotak isian bebas, trigger via Enter/klik kaca pembesar,
   *  SATU nilai. 'combobox' = MultiSelectComponent (checkbox + Terapkan) berisi
   *  daftar pilihan (loadOptions), BISA PILIH LEBIH DARI SATU (lihat modul
   *  Berita — kolom Kategori memakai mode ini karena kategori itu master data
   *  tetap, cocok dicocokkan by ID, bukan LIKE-nama). */
  mode?: CmsSearchTargetMode;
  loadOptions?: () => Observable<CmsComboboxOption[]>;
}

export interface CmsSortState {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/** Parameter yang dikirim ke `dataSource` tiap kali filter/sort/halaman berubah.
 *  `filters` cuma berisi entry untuk target yang SEDANG di-Apply (key = salah
 *  satu CmsSearchTargetDef.value) — konsumen memetakan ini ke query param
 *  repository-nya sendiri (lihat NewsIndexPage.toListParams sebagai contoh).
 *  `status` dan tiap entry `filters` berupa ARRAY (multi-select) — target
 *  mode 'text' selalu berisi array 1 elemen saat diterapkan; konsumen tinggal
 *  `.join(',')` untuk query param comma-separated (lihat backend CMSFilter). */
export interface CmsListParams {
  page: number;
  limit: number;
  /** Format sama seperti konvensi backend yang sudah ada: `-key` utk desc, `key` utk asc. */
  sort: string;
  status: string[];
  dateFrom: string;
  dateTo: string;
  filters: Record<string, string[]>;
}

/** Konfigurasi satu halaman index CMS — dioper sebagai satu object ke
 *  `<app-cms-index [config]="...">`. Murni data (tidak ada function di sini
 *  KECUALI loadOptions milik combobox, yang memang bagian dari kontrak
 *  data-source-nya sendiri, bukan logika tampilan). */
export interface CmsIndexConfig<T> {
  /** Dipakai di teks konfirmasi hapus/bulk-delete bawaan komponen, mis. "berita". */
  entityLabel: string;
  guideCards?: CmsGuideCard[];
  /** Kosongkan (undefined) untuk menyembunyikan filter Status sepenuhnya. Ini
   *  daftar checkbox MultiSelectComponent — JANGAN sertakan opsi sentinel
   *  seperti {value:'', label:'Semua Status'}, "semua" direpresentasikan
   *  sebagai TIDAK ADA yang dicentang (placeholder "Semua Status" otomatis
   *  tampil di trigger saat kosong, lihat CmsIndexComponent). */
  statusOptions?: MultiSelectOption[];
  /** Kosongkan untuk menyembunyikan search-combo (target kolom + input) sepenuhnya. */
  searchTargets?: CmsSearchTargetDef[];
  showDateRange?: boolean;
  columns: CmsColumnDef[];
  defaultSort: CmsSortState;
  /** Nama field ID unik tiap baris (mis. 'newsID') — dipakai trackBy & seleksi checkbox. */
  rowIdKey: Extract<keyof T, string>;
  limit?: number;

  /** Empty-state (tabel kosong) — ikon/teks berbeda per modul, mis. 'newspaper' + "Belum ada berita". */
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Tombol tambah cepat di empty-state (hanya tampil kalau tidak ada filter aktif) —
   *  kosongkan salah satu untuk menyembunyikan tombolnya. */
  createRoute?: string;
  createLabel?: string;
}

export interface CmsFilterPill {
  key: string;
  label: string;
}
