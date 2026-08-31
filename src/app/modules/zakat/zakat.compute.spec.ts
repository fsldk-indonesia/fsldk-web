import { computeZakat, formatRibuan, parseRibuan, tradeNetAsset, nisabHint } from './zakat.compute';

// Gold price 2,000,000/gram -> annual nisab 170,000,000; monthly ≈ 14,166,667.
const GOLD = 2_000_000;

describe('formatRibuan / parseRibuan', () => {
  it('formats thousands with dots and rounds', () => {
    expect(formatRibuan(5000000)).toBe('5.000.000');
    expect(formatRibuan(1234.6)).toBe('1.235');
  });
  it('parses dotted strings back to numbers, 0 on garbage', () => {
    expect(parseRibuan('5.000.000')).toBe(5000000);
    expect(parseRibuan('')).toBe(0);
    expect(parseRibuan('abc')).toBe(0);
  });
});

describe('computeZakat — penghasilan', () => {
  it('below monthly nisab -> not due', () => {
    const r = computeZakat('penghasilan', { wealth: '10.000.000' }, GOLD);
    expect(r.wajib).toBeFalse();
    expect(r.amount).toBe(0);
  });
  it('at/above monthly nisab -> due at 2.5%', () => {
    const r = computeZakat('penghasilan', { wealth: '20.000.000' }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.amount).toBe(500_000);
  });
});

describe('computeZakat — maal', () => {
  it('below nisab -> not due', () => {
    expect(computeZakat('maal', { wealth: '100.000.000' }, GOLD).wajib).toBeFalse();
  });
  it('above nisab -> due at 2.5%', () => {
    const r = computeZakat('maal', { wealth: '200.000.000' }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.amount).toBe(5_000_000);
  });
});

describe('computeZakat — emas', () => {
  it('below 85 grams -> not due', () => {
    expect(computeZakat('emas', { wealth: '80' }, GOLD).wajib).toBeFalse();
  });
  it('exactly 85 grams -> due on current sell value', () => {
    const r = computeZakat('emas', { wealth: '85' }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.amount).toBe(85 * GOLD * 0.025);
  });
});

describe('computeZakat — perdagangan', () => {
  it('net asset above nisab -> due at 2.5%', () => {
    const r = computeZakat('perdagangan', { stok: '100.000.000', kas: '100.000.000', utang: '0' }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.amount).toBe(5_000_000);
    expect(r.extraInfo).toContain('Aset bersih dagang');
  });
  it('positive but below nisab -> not due, still reports net asset', () => {
    const r = computeZakat('perdagangan', { stok: '1.000.000' }, GOLD);
    expect(r.wajib).toBeFalse();
    expect(r.extraInfo).toContain('1.000.000');
  });
  it('tradeNetAsset subtracts debt', () => {
    expect(tradeNetAsset({ stok: '10.000.000', piutang: '5.000.000', kas: '0', utang: '3.000.000' })).toBe(12_000_000);
  });
});

describe('computeZakat — pertanian', () => {
  it('below 653 kg -> not due', () => {
    expect(computeZakat('pertanian', { hasilPanenKg: 600, tarifPertanian: 'irigasi' }, GOLD).wajib).toBeFalse();
  });
  it('irrigated harvest above nisab -> 5% converted to Rp', () => {
    const r = computeZakat('pertanian', { hasilPanenKg: 700, tarifPertanian: 'irigasi' }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.amount).toBe(700 * 0.05 * 6000); // 210,000
  });
  it('rain-fed harvest uses 10%', () => {
    const r = computeZakat('pertanian', { hasilPanenKg: 700, tarifPertanian: 'hujan' }, GOLD);
    expect(r.amount).toBe(700 * 0.1 * 6000); // 420,000
  });
});

describe('computeZakat — peternakan', () => {
  it('kambing below nisab -> not due, livestock kind', () => {
    const r = computeZakat('peternakan', { jenisHewan: 'kambing', jumlahHewan: 10 }, GOLD);
    expect(r.kind).toBe('livestock');
    expect(r.wajib).toBeFalse();
    expect(r.hasInput).toBeTrue();
  });
  it('kambing 40 -> 1 goat due', () => {
    const r = computeZakat('peternakan', { jenisHewan: 'kambing', jumlahHewan: 40 }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.label).toContain('1 ekor kambing');
  });
  it('sapi 30 -> due', () => {
    expect(computeZakat('peternakan', { jenisHewan: 'sapi', jumlahHewan: 30 }, GOLD).wajib).toBeTrue();
  });
  it('kerbau is qiyas-ed to the sapi table', () => {
    const r = computeZakat('peternakan', { jenisHewan: 'kerbau', jumlahHewan: 30 }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.label).toContain('sapi/kerbau');
  });
  it('unta 5 -> 1 goat due', () => {
    const r = computeZakat('peternakan', { jenisHewan: 'unta', jumlahHewan: 5 }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.label).toContain('1 ekor kambing');
  });
  it('large herd (zakat === null row) is still due', () => {
    expect(computeZakat('peternakan', { jenisHewan: 'sapi', jumlahHewan: 150 }, GOLD).wajib).toBeTrue();
  });
});

describe('computeZakat — fitrah', () => {
  it('always due, scales per jiwa', () => {
    const r = computeZakat('fitrah', { jiwa: 3 }, GOLD);
    expect(r.wajib).toBeTrue();
    expect(r.amount).toBe(150_000);
  });
  it('defaults to 1 jiwa when unset', () => {
    expect(computeZakat('fitrah', {}, GOLD).amount).toBe(50_000);
  });
});

describe('nisabHint', () => {
  it('income hint reflects the live gold price', () => {
    expect(nisabHint('penghasilan', GOLD)).toContain(formatRibuan((GOLD * 85) / 12));
  });
  it('fitrah has no hint', () => {
    expect(nisabHint('fitrah', GOLD)).toBe('');
  });
});
