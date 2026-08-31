import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoldPrice } from '../../entities/gold-price';
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

/**
 * Public zakat calculator (no login) — mounted under PublicLayoutComponent at
 * `/kalkulator-zakat`, registered before the shortlink redirect catch-all in
 * app.routes.ts. All 7 calculations run in the browser (see zakat.compute.ts);
 * the only network call is the cached gold-price proxy. Styling is ported from
 * ldksyahid-app zakat-calculator/_index-styles.blade.php (class prefix `zk-`).
 */
@Component({
  selector: 'app-zakat-calculator-page',
  standalone: true,
  templateUrl: './zakat.calculator.page.html',
  imports: [FormsModule],
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

  // --- User actions ---
  onSelectType(key: ZakatTypeKey): void {
    this.selectedType.set(key);
    this.resetForm();
    this.presenter.selectType(key);
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

  /** Close when the click lands on the modal shell (the padding around the
   *  card), not on the card itself. */
  onModalShellClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeOrgModal();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.showOrgModal()) this.closeOrgModal();
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
