/**
 * Pure zakat calculation — ported from the `calculate()` / `updateUI()` logic
 * in ldksyahid-app zakat-calculator/_index-scripts.blade.php. No Angular, no
 * DOM: every function here is unit-testable via `npm test`.
 */
import {
  NISAB_GRAM,
  TARIF_UMUM,
  TARIF_PERTANIAN_IRIGASI,
  TARIF_PERTANIAN_HUJAN,
  NISAB_PERTANIAN_KG,
  HARGA_GABAH_ESTIMASI,
  FITRAH_PER_JIWA,
  PETERNAKAN_NISAB,
  ZakatTypeKey,
} from './zakat.constants';

// --- Number formatting (ported from formatRibuan / parseRibuan) ---

/** 5000000 -> "5.000.000". Rounds to the nearest integer first. */
export function formatRibuan(n: number): string {
  return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "5.000.000" -> 5000000. Non-numeric input (or a non-string) yields 0. */
export function parseRibuan(s: string): number {
  return parseFloat(String(s ?? '').replace(/\./g, '')) || 0;
}

// --- Input & result shapes ---

export interface ZakatInput {
  /** Single field for wealth types: thousands-formatted for money, a plain
   *  decimal string for gold (grams). */
  wealth?: string;
  jiwa?: number;
  stok?: string;
  piutang?: string;
  kas?: string;
  utang?: string;
  hasilPanenKg?: number;
  tarifPertanian?: 'irigasi' | 'hujan';
  jenisHewan?: keyof typeof PETERNAKAN_NISAB;
  jumlahHewan?: number;
}

export interface ZakatResult {
  /** Whether the user entered enough for a result to be shown at all. */
  hasInput: boolean;
  wajib: boolean;
  /** Rp amount for `kind: 'money'`; ignored by the UI for `kind: 'livestock'`. */
  amount: number;
  /** Display string for the result headline (e.g. "Rp 125.000" or an animal count). */
  label: string;
  extraInfo?: string;
  kind: 'money' | 'livestock';
}

// --- Nisab hint line (dynamic — depends on the live gold price) ---

export function nisabHint(type: ZakatTypeKey, goldPrice: number): string {
  const nisabTahun = goldPrice * NISAB_GRAM;
  switch (type) {
    case 'penghasilan':
      return `Nisab/bulan: Rp ${formatRibuan(nisabTahun / 12)} (85gr ÷ 12) | Ref: Fatwa MUI No.3/2003`;
    case 'maal':
      return `Nisab Maal: Rp ${formatRibuan(nisabTahun)} (disimpan ≥ 1 haul) | Ref: Fatwa MUI No.3/2003`;
    case 'emas':
      return 'Nisab: 85 gram emas (≥ 1 haul). Input dalam gram.';
    case 'perdagangan':
      return `Nisab: Rp ${formatRibuan(nisabTahun)} (setara 85gr emas, ≥ 1 haul) | Ref: Fatwa MUI No.4/2014`;
    case 'pertanian':
      return 'Nisab: 653 kg gabah / 524 kg beras per panen. Tidak perlu haul. | Ref: Fatwa MUI No.3/2003';
    case 'peternakan':
      return 'Nisab berbeda tiap jenis hewan. Disyaratkan ≥ 1 haul. | Ref: Kitab Fiqh Zakat Yusuf Qardhawi';
    default:
      return '';
  }
}

/** Trade net asset: (stok + piutang + kas) − utang. Drives the summary box. */
export function tradeNetAsset(input: ZakatInput): number {
  return parseRibuan(input.stok ?? '') + parseRibuan(input.piutang ?? '') + parseRibuan(input.kas ?? '') - parseRibuan(input.utang ?? '');
}

// --- Main calculation ---

const MONEY_NOT_DUE: Omit<ZakatResult, 'hasInput'> = { wajib: false, amount: 0, label: 'Rp 0', kind: 'money' };

export function computeZakat(type: ZakatTypeKey, input: ZakatInput, goldPrice: number): ZakatResult {
  const hasInput = hasAnyInput(type, input);
  const nisabVal = goldPrice * NISAB_GRAM;

  switch (type) {
    case 'penghasilan': {
      const w = parseRibuan(input.wealth ?? '');
      return money(hasInput, w >= nisabVal / 12, w * TARIF_UMUM);
    }
    case 'maal': {
      const w = parseRibuan(input.wealth ?? '');
      return money(hasInput, w >= nisabVal, w * TARIF_UMUM);
    }
    case 'emas': {
      const gram = parseFloat(input.wealth ?? '') || 0;
      return money(hasInput, gram >= NISAB_GRAM, gram * goldPrice * TARIF_UMUM);
    }
    case 'perdagangan': {
      const stok = parseRibuan(input.stok ?? '');
      const piutang = parseRibuan(input.piutang ?? '');
      const kas = parseRibuan(input.kas ?? '');
      const asetBersih = stok + piutang + kas - parseRibuan(input.utang ?? '');
      if (asetBersih > 0 && stok + piutang + kas > 0) {
        const wajib = asetBersih >= nisabVal;
        return {
          hasInput,
          wajib,
          amount: wajib ? asetBersih * TARIF_UMUM : 0,
          label: `Rp ${formatRibuan(wajib ? asetBersih * TARIF_UMUM : 0)}`,
          extraInfo: `Aset bersih dagang: Rp ${formatRibuan(asetBersih)}`,
          kind: 'money',
        };
      }
      return { hasInput, ...MONEY_NOT_DUE };
    }
    case 'pertanian': {
      const kg = input.hasilPanenKg || 0;
      const tarif = input.tarifPertanian === 'hujan' ? TARIF_PERTANIAN_HUJAN : TARIF_PERTANIAN_IRIGASI;
      const tarifLabel = tarif === TARIF_PERTANIAN_IRIGASI ? '5% (Irigasi)' : '10% (Tadah Hujan)';
      if (kg >= NISAB_PERTANIAN_KG) {
        const zakatKg = kg * tarif;
        const total = zakatKg * HARGA_GABAH_ESTIMASI;
        return {
          hasInput,
          wajib: true,
          amount: total,
          label: `Rp ${formatRibuan(total)}`,
          extraInfo: `Zakat: ${zakatKg.toFixed(2)} kg gabah ≈ Rp ${formatRibuan(total)} (est. Rp 6.000/kg) | Tarif: ${tarifLabel}`,
          kind: 'money',
        };
      }
      return { hasInput, ...MONEY_NOT_DUE };
    }
    case 'peternakan': {
      const jumlah = input.jumlahHewan || 0;
      const jenis = input.jenisHewan ?? 'kambing';
      const tabel = jenis === 'kerbau' ? PETERNAKAN_NISAB.sapi : PETERNAKAN_NISAB[jenis];
      if (tabel && jumlah > 0) {
        const row = tabel.find((r) => jumlah >= r.min && jumlah <= r.max) ?? tabel[tabel.length - 1];
        // Reference splits zakat===0 into showMoneyResult; here every matched
        // row renders as livestock (keterangan), which is what the not-due
        // branch of showPeternakanResult would have shown anyway.
        return {
          hasInput,
          wajib: row.zakat === null || (row.zakat ?? 0) > 0,
          amount: 0,
          label: row.keterangan,
          extraInfo: row.keterangan,
          kind: 'livestock',
        };
      }
      return { hasInput, wajib: false, amount: 0, label: 'Belum wajib', kind: 'livestock' };
    }
    case 'fitrah': {
      const jiwa = input.jiwa && input.jiwa > 0 ? input.jiwa : 1;
      const total = jiwa * FITRAH_PER_JIWA;
      return { hasInput, wajib: true, amount: total, label: `Rp ${formatRibuan(total)}`, kind: 'money' };
    }
    default:
      return { hasInput, ...MONEY_NOT_DUE };
  }
}

function money(hasInput: boolean, wajib: boolean, total: number): ZakatResult {
  return {
    hasInput,
    wajib,
    amount: wajib ? total : 0,
    label: `Rp ${formatRibuan(wajib ? total : 0)}`,
    kind: 'money',
  };
}

/** Ported from hasAnyInput() — whether to show the result box at all. */
export function hasAnyInput(type: ZakatTypeKey, input: ZakatInput): boolean {
  switch (type) {
    case 'fitrah':
      return true;
    case 'perdagangan':
      return parseRibuan(input.stok ?? '') > 0 || parseRibuan(input.piutang ?? '') > 0 || parseRibuan(input.kas ?? '') > 0;
    case 'pertanian':
      return (input.hasilPanenKg || 0) > 0;
    case 'peternakan':
      return (input.jumlahHewan || 0) > 0;
    default:
      return parseRibuan(input.wealth ?? '') > 0 || (parseFloat(input.wealth ?? '') || 0) > 0;
  }
}
