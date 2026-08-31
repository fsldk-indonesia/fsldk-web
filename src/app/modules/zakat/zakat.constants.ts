/**
 * Static data for the zakat calculator — parameters, fatwa citations, nisab
 * tables, guide content, and the amil-zakat link list. Nothing here is
 * DB-driven (matches CLAUDE.md "Landing Page content is intentionally
 * hardcoded"). Values transcribed verbatim from ldksyahid-app
 * zakat-calculator/_index-scripts.blade.php & index.blade.php — do not change
 * the syar'i numbers or fatwa text without a religious-law basis.
 */

// --- Calculation parameters (verbatim from _index-scripts.blade.php) ---
export const NISAB_GRAM = 85; // grams of gold, annual nisab
export const GOLD_PRICE_DEFAULT = 2_600_000; // Rp/gram, fallback before first fetch (matches backend ZAKAT_GOLD_PRICE_FALLBACK)
export const FITRAH_PER_JIWA = 50_000; // Rp/person (BAZNAS national standard)
export const NISAB_PERTANIAN_KG = 653; // kg of unhulled rice per harvest
export const HARGA_GABAH_ESTIMASI = 6_000; // Rp/kg, for converting agriculture zakat to Rp
export const TARIF_UMUM = 0.025; // 2.5% — income, maal, gold, trade
export const TARIF_PERTANIAN_IRIGASI = 0.05; // 5% — irrigated / with watering cost
export const TARIF_PERTANIAN_HUJAN = 0.1; // 10% — rain-fed / no cost

/** One row of a livestock nisab table. `zakat` is the count of animals due;
 *  `null` means "scales with herd size, see keterangan". */
export interface PeternakanRow {
  min: number;
  max: number;
  zakat: number | null;
  keterangan: string;
}

/** Livestock nisab tables. Source: Fiqh Zakat by Yusuf Qardhawi & Ministry of
 *  Religion RI. `kerbau` (buffalo) is qiyas-ed to the `sapi` table at compute
 *  time, so it stays empty here — verbatim from `peternakanNisab`. */
export const PETERNAKAN_NISAB: Record<'kambing' | 'sapi' | 'unta' | 'kerbau', PeternakanRow[]> = {
  kambing: [
    { min: 1, max: 39, zakat: 0, keterangan: 'Belum wajib' },
    { min: 40, max: 120, zakat: 1, keterangan: '1 ekor kambing/domba (umur ≥ 1 th)' },
    { min: 121, max: 200, zakat: 2, keterangan: '2 ekor kambing/domba' },
    { min: 201, max: 399, zakat: 3, keterangan: '3 ekor kambing/domba' },
    { min: 400, max: 499, zakat: 4, keterangan: '4 ekor kambing/domba' },
  ],
  sapi: [
    { min: 1, max: 29, zakat: 0, keterangan: 'Belum wajib' },
    { min: 30, max: 39, zakat: 1, keterangan: "1 ekor sapi/kerbau umur ≥ 1 th (tabi')" },
    { min: 40, max: 59, zakat: 1, keterangan: '1 ekor sapi/kerbau umur ≥ 2 th (musinnah)' },
    { min: 60, max: 69, zakat: 2, keterangan: '2 ekor sapi/kerbau umur ≥ 1 th' },
    { min: 70, max: 79, zakat: 3, keterangan: '2 ekor umur ≥ 1 th + 1 ekor umur ≥ 2 th' },
    { min: 80, max: 89, zakat: 2, keterangan: '2 ekor sapi/kerbau umur ≥ 2 th' },
    { min: 90, max: 99, zakat: 3, keterangan: '3 ekor sapi/kerbau umur ≥ 1 th' },
    { min: 100, max: 999, zakat: null, keterangan: 'Setiap 30 ekor: 1 ekor umur ≥ 1 th; setiap 40 ekor: 1 ekor umur ≥ 2 th' },
  ],
  unta: [
    { min: 1, max: 4, zakat: 0, keterangan: 'Belum wajib' },
    { min: 5, max: 9, zakat: 1, keterangan: '1 ekor kambing' },
    { min: 10, max: 14, zakat: 2, keterangan: '2 ekor kambing' },
    { min: 15, max: 19, zakat: 3, keterangan: '3 ekor kambing' },
    { min: 20, max: 24, zakat: 4, keterangan: '4 ekor kambing' },
    { min: 25, max: 35, zakat: 1, keterangan: '1 ekor unta bintu makhad (umur ≥ 1 th)' },
    { min: 36, max: 45, zakat: 1, keterangan: '1 ekor unta bintu labun (umur ≥ 2 th)' },
    { min: 46, max: 60, zakat: 1, keterangan: '1 ekor unta hiqqah (umur ≥ 3 th)' },
    { min: 61, max: 75, zakat: 1, keterangan: "1 ekor unta jadza'ah (umur ≥ 4 th)" },
    { min: 76, max: 90, zakat: 2, keterangan: '2 ekor unta bintu labun' },
    { min: 91, max: 120, zakat: 2, keterangan: '2 ekor unta hiqqah' },
    { min: 121, max: 999, zakat: null, keterangan: 'Setiap 40 ekor: 1 bintu labun; setiap 50 ekor: 1 hiqqah' },
  ],
  kerbau: [], // buffalo uses the sapi table (qiyas)
};

export type ZakatTypeKey =
  | 'penghasilan'
  | 'maal'
  | 'emas'
  | 'perdagangan'
  | 'pertanian'
  | 'peternakan'
  | 'fitrah';

/** Which input form a type shows. */
export type ZakatInputKind = 'wealth' | 'fitrah' | 'perdagangan' | 'pertanian' | 'peternakan';

export interface ZakatType {
  key: ZakatTypeKey;
  emoji: string;
  label: string;
  input: ZakatInputKind;
  /** Label of the single money/gram field for `input: 'wealth'`. */
  wealthLabel?: string;
  /** Description box HTML (trusted constant, rendered via [innerHTML]). */
  descHtml: string;
}

/** Pills + description box. Text copied as-is from `updateUI()`, citations
 *  included ("Fatwa MUI No.3/2003" etc.). */
export const ZAKAT_TYPES: ZakatType[] = [
  {
    key: 'penghasilan',
    emoji: '💼',
    label: 'Penghasilan',
    input: 'wealth',
    wealthLabel: 'Penghasilan Bersih Per Bulan',
    descHtml:
      'Zakat atas penghasilan/profesi bulanan. Tarif <strong>2,5%</strong> dari penghasilan bruto jika mencapai nisab. Metode bruto dipilih atas prinsip <em>ihtiyath</em>.',
  },
  {
    key: 'maal',
    emoji: '🏦',
    label: 'Maal',
    input: 'wealth',
    wealthLabel: 'Total Harta Simpanan',
    descHtml:
      'Zakat atas harta simpanan (tabungan, saham, uang tunai) yang telah tersimpan <strong>1 tahun penuh (haul)</strong>. Tarif <strong>2,5%</strong>.',
  },
  {
    key: 'emas',
    emoji: '🥇',
    label: 'Emas/Perak',
    input: 'wealth',
    wealthLabel: 'Total Berat Emas (Gram)',
    descHtml:
      'Zakat atas kepemilikan emas/perak ≥ nisab setelah <strong>1 haul</strong>. Tarif <strong>2,5%</strong> dari nilai jual emas saat ini.',
  },
  {
    key: 'perdagangan',
    emoji: '🛒',
    label: 'Perdagangan',
    input: 'perdagangan',
    descHtml:
      'Zakat atas usaha perdagangan. Dihitung dari <strong>(Stok + Piutang Lancar + Kas/Bank) − Utang Jatuh Tempo</strong>. Tarif <strong>2,5%</strong> jika mencapai nisab.',
  },
  {
    key: 'pertanian',
    emoji: '🌾',
    label: 'Pertanian',
    input: 'pertanian',
    descHtml:
      'Zakat hasil pertanian per panen. Tarif: <strong>5%</strong> jika menggunakan irigasi/biaya pengairan, <strong>10%</strong> jika tadah hujan/tanpa biaya. Tidak disyaratkan haul.',
  },
  {
    key: 'peternakan',
    emoji: '🐄',
    label: 'Peternakan',
    input: 'peternakan',
    descHtml:
      "Zakat atas hewan ternak yang digembalakan (sa'imah) dan telah dimiliki selama <strong>1 haul</strong>. Nisab dan kadar zakat berbeda untuk tiap jenis hewan.",
  },
  {
    key: 'fitrah',
    emoji: '🌙',
    label: 'Fitrah',
    input: 'fitrah',
    descHtml:
      'Wajib bagi setiap Muslim yang mampu menjelang Idul Fitri. Standar: <strong>Rp 50.000/jiwa</strong> (BAZNAS Pusat).',
  },
];

/** Livestock species selector options for the peternakan form. */
export const HEWAN_TERNAK_OPTIONS: { value: keyof typeof PETERNAKAN_NISAB; label: string }[] = [
  { value: 'kambing', label: '🐑 Kambing / Domba' },
  { value: 'sapi', label: '🐄 Sapi' },
  { value: 'kerbau', label: '🦬 Kerbau (diqiyaskan sapi)' },
  { value: 'unta', label: '🐪 Unta' },
];

export interface PanduanItem {
  title: string;
  /** Trusted static markup — rendered via [innerHTML]; never user input. */
  bodyHtml: string;
}

/** "Panduan Nisab Zakat" accordion — content from index.blade.php `.zk-accordion`. */
export const PANDUAN_NISAB: PanduanItem[] = [
  {
    title: '💼 Zakat Penghasilan',
    bodyHtml:
      'Nisab: <strong>85gr emas/tahun</strong> (atau 85/12 per bulan). Tarif <strong>2,5%</strong>. Dasar: <em>Fatwa MUI No.3/2003</em>.',
  },
  {
    title: '🏦 Zakat Maal',
    bodyHtml:
      'Nisab: <strong>85gr emas</strong>, disimpan <strong>≥ 1 haul</strong>. Tarif <strong>2,5%</strong>. Berlaku untuk tabungan, deposito, saham, uang tunai.',
  },
  {
    title: '🥇 Zakat Emas/Perak',
    bodyHtml:
      'Nisab emas: <strong>85 gram</strong>. Nisab perak: <strong>595 gram</strong>. Tarif <strong>2,5%</strong>. Disyaratkan ≥ 1 haul.',
  },
  {
    title: '🛒 Zakat Perdagangan',
    bodyHtml:
      'Nisab: <strong>85gr emas</strong> (≥ 1 haul). Dasar hitung: <strong>(Stok + Piutang Lancar + Kas) − Utang Jatuh Tempo</strong>. Tarif <strong>2,5%</strong>. Dasar: <em>Fatwa MUI No.4/2014</em>.',
  },
  {
    title: '🌾 Zakat Pertanian',
    bodyHtml:
      "Nisab: <strong>653 kg gabah</strong> (setara 524 kg beras) per panen. <strong>Tidak perlu haul</strong>. Tarif: <strong>10%</strong> jika tadah hujan, <strong>5%</strong> jika menggunakan irigasi/biaya. Dasar: QS. Al-An'am: 141 & Fatwa MUI No.3/2003.",
  },
  {
    title: '🐄 Zakat Peternakan',
    bodyHtml: `
      <p class="mb-2">Disyaratkan <strong>sa'imah</strong> (digembalakan) &amp; <strong>≥ 1 haul</strong>. Kadar zakat berupa hewan, bukan uang.</p>
      <p class="zk-table-label">🐑 KAMBING/DOMBA</p>
      <table class="zk-nisab-table mb-3">
        <tr><th>Jumlah</th><th>Zakat</th></tr>
        <tr><td>1 – 39</td><td>Belum wajib</td></tr>
        <tr><td>40 – 120</td><td>1 ekor kambing</td></tr>
        <tr><td>121 – 200</td><td>2 ekor kambing</td></tr>
        <tr><td>201 – 399</td><td>3 ekor kambing</td></tr>
        <tr><td>≥ 400</td><td>+1 ekor per 100</td></tr>
      </table>
      <p class="zk-table-label">🐄 SAPI / 🦬 KERBAU</p>
      <table class="zk-nisab-table mb-3">
        <tr><th>Jumlah</th><th>Zakat</th></tr>
        <tr><td>1 – 29</td><td>Belum wajib</td></tr>
        <tr><td>30 – 39</td><td>1 ekor umur ≥ 1 th</td></tr>
        <tr><td>40 – 59</td><td>1 ekor umur ≥ 2 th</td></tr>
        <tr><td>60 – 69</td><td>2 ekor umur ≥ 1 th</td></tr>
        <tr><td>≥ 70</td><td>Kombinasi per 30/40 ekor</td></tr>
      </table>
      <p class="zk-table-label">🐪 UNTA</p>
      <table class="zk-nisab-table">
        <tr><th>Jumlah</th><th>Zakat</th></tr>
        <tr><td>1 – 4</td><td>Belum wajib</td></tr>
        <tr><td>5 – 9</td><td>1 ekor kambing</td></tr>
        <tr><td>10 – 14</td><td>2 ekor kambing</td></tr>
        <tr><td>25 – 35</td><td>1 ekor unta ≥ 1 th</td></tr>
        <tr><td>36 – 45</td><td>1 ekor unta ≥ 2 th</td></tr>
        <tr><td>≥ 76</td><td>2 ekor unta ≥ 2 th</td></tr>
      </table>
      <p class="mt-2 mb-0 zk-form-hint">Ref: Kitab Fiqh Zakat, Yusuf Qardhawi &amp; KMA RI</p>
    `,
  },
  {
    title: '🌙 Zakat Fitrah',
    bodyHtml:
      'Wajib tiap Muslim yang mampu. Besaran: <strong>2,5 kg beras</strong>/jiwa atau setara <strong>Rp 45.000–55.000</strong>. Standar: <em>BAZNAS Pusat Rp 50.000</em>.',
  },
  {
    title: '🔍 Kenapa Berbeda dengan BSI / Platform Lain?',
    bodyHtml:
      'Platform seperti BSI menggunakan metode <strong>Netto</strong>: penghasilan dikurangi kebutuhan pokok dan cicilan dulu baru dihitung 2,5%. Kalkulator ini pakai <strong>Bruto</strong> atas dasar <em>ihtiyath</em> (Fatwa MUI No.3/2003). Keduanya sah secara syariat.',
  },
];

export interface LembagaZakat {
  name: string;
  tagline: string;
  url: string;
  /** Domain used for the Clearbit logo lookup. */
  domain: string;
}

/** Amil-zakat links for the "Tunaikan Zakat" modal — external, hardcoded, no
 *  click tracking. Logos load from Clearbit with a favicon fallback. */
export const LEMBAGA_ZAKAT: LembagaZakat[] = [
  { name: 'Dompet Dhuafa', tagline: 'Zakat, Infak & Sedekah', url: 'https://digital.dompetdhuafa.org/', domain: 'dompetdhuafa.org' },
  { name: 'Rumah Zakat', tagline: 'Berbagi untuk Sesama', url: 'https://www.rumahzakat.org/', domain: 'rumahzakat.org' },
  { name: 'BAZNAS', tagline: 'Badan Amil Zakat Nasional', url: 'https://baznas.go.id/', domain: 'baznas.go.id' },
  { name: 'Lazismu', tagline: 'Zakat Infak Sedekah Muhammadiyah', url: 'https://donasi.lazismu.org/', domain: 'lazismu.org' },
  { name: 'Rumah Yatim', tagline: 'Berbagi Bersama Yatim & Dhuafa', url: 'https://rumah-yatim.org/', domain: 'rumah-yatim.org' },
  { name: 'Kitabisa', tagline: 'Platform Donasi & Zakat Online', url: 'https://kitabisa.com/', domain: 'kitabisa.com' },
];

/** Left decorative column — how-to steps (index.blade.php `.zk-how-list`). */
export const CARA_PENGGUNAAN: string[] = [
  'Perbarui harga emas jika diperlukan',
  'Pilih jenis zakat yang ingin dihitung',
  'Isi data sesuai panduan pada form',
  'Hasil zakat dihitung otomatis real-time',
  'Cek panduan nisab untuk referensi hukum',
];

/** "Catatan Penting" warning list (index.blade.php `.zk-warning-list`). */
export const CATATAN_PENTING: string[] = [
  'Harga emas diambil otomatis dari logammulia.com (Antam). Gunakan tombol Perbarui untuk menyegarkan data.',
  'Zakat Pertanian: konversi nilai Rp menggunakan estimasi harga gabah Rp 6.000/kg. Sesuaikan dengan harga aktual daerah Anda.',
  'Zakat Peternakan dibayarkan dalam bentuk hewan, bukan uang tunai. Nilai Rp di hasil hanya estimasi.',
  'Kalkulator ini bersifat alat bantu estimasi. Konsultasikan ke lembaga amil zakat untuk kepastian hukum.',
  "Dasar hukum: QS. At-Taubah: 103, QS. Al-An'am: 141, HR. Bukhari & Muslim, Fatwa MUI No.3/2003 & No.4/2014.",
];
