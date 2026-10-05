import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoldPrice } from '../../entities/gold-price';
import { IconComponent } from '../../../../shared/icon.component';
import { PopupModalComponent } from '../../../../shared/popup-modal.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { SelectComponent } from '../../../../shared/select.component';
import {
  CARA_PENGGUNAAN,
  CATATAN_PENTING,
  GOLD_PRICE_DEFAULT,
  HEWAN_TERNAK_OPTIONS,
  LEMBAGA_ZAKAT,
  PANDUAN_NISAB,
  PETERNAKAN_NISAB,
  ZAKAT_TYPES,
  ZakatTypeKey,
} from '../../zakat.constants';
import { ZakatInput, ZakatResult, formatRibuan, tradeNetAsset } from '../../zakat.compute';
import { ZakatCalculatorPresenter } from './zakat.calculator.presenter';
import { FetchStatus, ZakatCalculatorView } from './zakat.calculator.view';

type MoneyField = 'wealth' | 'stok' | 'piutang' | 'kas' | 'utang';
type TypeAccent = 'primary' | 'gold';

/** Icon per jenis zakat — kartu pemilih jenis (lihat zk-type-tile di template). */
const TYPE_ICON: Record<ZakatTypeKey, string> = {
  penghasilan: 'briefcase',
  maal: 'landmark',
  emas: 'coins',
  perdagangan: 'shopping-bag',
  pertanian: 'seedling',
  peternakan: 'paw',
  fitrah: 'moon',
};

/** Aksen warna badge ikon per jenis — hanya 2 keluarga warna (hijau brand +
 *  emas aksen), bukan warna acak per kartu, supaya tetap satu bahasa visual. */
const TYPE_ACCENT: Record<ZakatTypeKey, TypeAccent> = {
  penghasilan: 'primary',
  maal: 'gold',
  emas: 'gold',
  perdagangan: 'primary',
  pertanian: 'primary',
  peternakan: 'gold',
  fitrah: 'primary',
};

/** Label tarif ringkas untuk badge pojok kartu. */
const TYPE_RATE: Record<ZakatTypeKey, string> = {
  penghasilan: '2,5%',
  maal: '2,5%',
  emas: '2,5%',
  perdagangan: '2,5%',
  pertanian: '5–10%',
  peternakan: 'Hewan',
  fitrah: 'Rp 50rb/jiwa',
};

/**
 * Public zakat calculator (no login) — mounted under PublicLayoutComponent at
 * `/kalkulator-zakat`, registered before the shortlink redirect catch-all in
 * app.routes.ts. All 7 calculations run in the browser (see zakat.compute.ts);
 * the only network call is the cached gold-price proxy. Redesigned to match
 * the hero + section-blob-drift canvas used by Galeri/Struktur Organisasi;
 * the amil-zakat picker now uses the shared PopupModalComponent (mobile
 * sheet) instead of a hand-rolled modal, and the jenis-zakat pill row became
 * a searchable card grid that collapses into the same mobile-sheet pattern
 * on small screens.
 */
@Component({
  selector: 'app-zakat-calculator-page',
  standalone: true,
  templateUrl: './zakat.calculator.page.html',
  imports: [FormsModule, IconComponent, PopupModalComponent, PageHeroComponent, SelectComponent],
  providers: [ZakatCalculatorPresenter],
  styleUrl: './zakat.calculator.page.scss',
})
export class ZakatCalculatorPage implements OnInit, OnDestroy, ZakatCalculatorView {
  private presenter = inject(ZakatCalculatorPresenter);

  readonly types = ZAKAT_TYPES;
  readonly panduan = PANDUAN_NISAB;
  readonly lembaga = LEMBAGA_ZAKAT;
  readonly caraPenggunaan = CARA_PENGGUNAAN;
  readonly catatanPenting = CATATAN_PENTING;
  readonly hewanOptions = HEWAN_TERNAK_OPTIONS;

  // --- Presenter-fed view state ---
  goldPrice = signal<GoldPrice | null>(null);
  goldPriceText = computed(() => formatRibuan(this.goldPrice()?.price ?? GOLD_PRICE_DEFAULT));
  nisabHintText = signal('');
  result = signal<ZakatResult | null>(null);
  fetchState = signal<{ status: FetchStatus; message?: string }>({ status: 'idle' });
  fetching = computed(() => this.fetchState().status === 'loading');

  // --- Local UI state ---
  selectedType = signal<ZakatTypeKey>('penghasilan');
  selectedMeta = computed(() => this.types.find((t) => t.key === this.selectedType())!);
  showResult = computed(() => !!this.result()?.hasInput);
  showPayButton = computed(() => { const r = this.result(); return !!r?.hasInput && r.wajib; });
  openAcc = signal<number | null>(null);
  showOrgModal = signal(false);

  /** Pencarian jenis zakat — dipakai bersama oleh grid desktop & mobile sheet. */
  typeQuery = signal('');
  filteredTypes = computed(() => {
    const q = this.typeQuery().trim().toLowerCase();
    if (!q) return this.types;
    return this.types.filter((t) => t.label.toLowerCase().includes(q));
  });
  showTypePicker = signal(false);

  // --- Form fields ---
  money: Record<MoneyField, string> = { wealth: '', stok: '', piutang: '', kas: '', utang: '' };
  gram = '';
  jiwa = 1;
  hasilPanenKg: number | null = null;
  tarifPertanian: 'irigasi' | 'hujan' = 'irigasi';
  jenisHewan: keyof typeof PETERNAKAN_NISAB = 'kambing';
  jumlahHewan: number | null = null;

  private statusTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.start();
  }

  ngOnDestroy(): void {
    if (this.statusTimer) clearTimeout(this.statusTimer);
    document.body.style.overflow = '';
  }

  // --- Jenis zakat helpers (kartu pemilih) ---
  typeIcon(key: ZakatTypeKey): string { return TYPE_ICON[key]; }
  typeAccent(key: ZakatTypeKey): TypeAccent { return TYPE_ACCENT[key]; }
  typeRate(key: ZakatTypeKey): string { return TYPE_RATE[key]; }

  openTypePicker(): void {
    this.typeQuery.set('');
    this.showTypePicker.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeTypePicker(): void {
    this.showTypePicker.set(false);
    document.body.style.overflow = '';
  }

  // --- User actions ---
  onSelectType(key: ZakatTypeKey): void {
    this.selectedType.set(key);
    this.resetForm();
    this.presenter.selectType(key);
    if (this.showTypePicker()) this.closeTypePicker();
  }

  refreshGoldPrice(): void {
    this.presenter.refreshGoldPrice();
  }

  /** Thousands-format a money field in place while preserving the caret. */
  onMoneyInput(event: Event, field: MoneyField): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\./g, '').replace(/\D/g, '');
    const num = parseInt(digits, 10) || 0;
    const caret = el.selectionStart ?? el.value.length;
    const prevLen = el.value.length;
    const formatted = num > 0 ? formatRibuan(num) : '';
    this.money[field] = formatted;
    el.value = formatted;
    const diff = formatted.length - prevLen;
    try { el.setSelectionRange(caret + diff, caret + diff); } catch { /* ignore */ }
    this.recompute();
  }

  recompute(): void {
    this.presenter.update(this.buildInput());
  }

  tradeNet(): number {
    return tradeNetAsset(this.money);
  }

  tradeNetText(): string {
    return formatRibuan(this.tradeNet());
  }

  toggleAcc(i: number): void {
    this.openAcc.set(this.openAcc() === i ? null : i);
  }

  openOrgModal(): void {
    this.showOrgModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeOrgModal(): void {
    this.showOrgModal.set(false);
    document.body.style.overflow = '';
  }

  logoUrl(domain: string): string {
    return `https://logo.clearbit.com/${domain}`;
  }

  onLogoError(event: Event, domain: string): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  // --- ZakatCalculatorView ---
  setGoldPrice(price: GoldPrice): void { this.goldPrice.set(price); }
  setNisabHint(hint: string): void { this.nisabHintText.set(hint); }
  setResult(result: ZakatResult): void { this.result.set(result); }
  setFetchStatus(status: FetchStatus, message?: string): void {
    this.fetchState.set({ status, message });
    if (this.statusTimer) clearTimeout(this.statusTimer);
    if (status === 'ok' || status === 'fail') {
      this.statusTimer = setTimeout(() => this.fetchState.set({ status: 'idle' }), 5000);
    }
  }

  private buildInput(): ZakatInput {
    return {
      wealth: this.selectedType() === 'emas' ? this.gram : this.money.wealth,
      jiwa: this.jiwa,
      stok: this.money.stok,
      piutang: this.money.piutang,
      kas: this.money.kas,
      utang: this.money.utang,
      hasilPanenKg: this.hasilPanenKg ?? 0,
      tarifPertanian: this.tarifPertanian,
      jenisHewan: this.jenisHewan,
      jumlahHewan: this.jumlahHewan ?? 0,
    };
  }

  private resetForm(): void {
    this.money = { wealth: '', stok: '', piutang: '', kas: '', utang: '' };
    this.gram = '';
    this.jiwa = 1;
    this.hasilPanenKg = null;
    this.tarifPertanian = 'irigasi';
    this.jenisHewan = 'kambing';
    this.jumlahHewan = null;
  }
}
