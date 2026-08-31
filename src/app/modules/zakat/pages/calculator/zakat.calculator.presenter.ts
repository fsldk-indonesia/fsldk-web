import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ZakatRepository } from '../../repositories/zakat.repository';
import { GOLD_PRICE_DEFAULT, ZakatTypeKey } from '../../zakat.constants';
import { ZakatInput, computeZakat, formatRibuan, nisabHint } from '../../zakat.compute';
import { ZakatCalculatorView } from './zakat.calculator.view';

@Injectable()
export class ZakatCalculatorPresenter extends BasePresenter<ZakatCalculatorView> {
  private repo = inject(ZakatRepository);

  /** Authoritative gold price used for every calculation. */
  private goldPrice = GOLD_PRICE_DEFAULT;
  private type: ZakatTypeKey = 'penghasilan';
  private input: ZakatInput = {};

  /** Called from ngOnInit after attachView: seed the UI, then silently fetch
   *  the live gold price (a failure here must not disturb the page). */
  start(): void {
    this.emit();
    this.repo.goldPrice(false, true).subscribe({
      next: (p) => {
        if (p.success && p.price) this.goldPrice = p.price;
        this.view.setGoldPrice(p);
        this.emit();
      },
      error: () => { /* keep the default price */ },
    });
  }

  selectType(type: ZakatTypeKey): void {
    this.type = type;
    this.input = {};
    this.emit();
  }

  update(input: ZakatInput): void {
    this.input = input;
    this.view.setResult(computeZakat(this.type, this.input, this.goldPrice));
  }

  /** Manual "Perbarui" button — forces an upstream re-fetch and reports status. */
  refreshGoldPrice(): void {
    this.view.setFetchStatus('loading');
    this.repo.goldPrice(true, true).subscribe({
      next: (p) => {
        if (p.success && p.price) {
          this.goldPrice = p.price;
          this.view.setGoldPrice(p);
          this.emit();
          this.view.setFetchStatus('ok', `Harga emas berhasil diperbarui: Rp ${formatRibuan(p.price)}/gr (Antam)`);
        } else {
          this.view.setGoldPrice(p);
          this.view.setFetchStatus('fail', 'Gagal mengambil harga. Menggunakan harga default.');
        }
      },
      error: () => this.view.setFetchStatus('fail', 'Koneksi gagal. Gunakan tombol Perbarui untuk mencoba lagi.'),
    });
  }

  /** Push the current nisab hint + result for the active type/input. */
  private emit(): void {
    this.view.setNisabHint(nisabHint(this.type, this.goldPrice));
    this.view.setResult(computeZakat(this.type, this.input, this.goldPrice));
  }
}
