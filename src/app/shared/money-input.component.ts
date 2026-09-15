import { Component, ElementRef, Input, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatThousands } from '../core/utils/format-rupiah';

/**
 * Input nominal uang dengan mask pemisah ribuan titik langsung saat mengetik
 * (mis. mengetik "5000000" tampil "5.000.000") — pola live-formatting sama
 * persis seperti `onMoneyInput()` di zakat.calculator.page.ts (caret
 * dipertahankan lewat selisih panjang string sebelum/sesudah format), tapi
 * diekstrak jadi ControlValueAccessor supaya dipakai lewat `[(ngModel)]`
 * biasa di form Campaign/Donasi/Penarikan/Goods tanpa duplikasi logika.
 * Value yang di-emit/diterima selalu number murni (bukan string berformat).
 */
@Component({
  selector: 'app-money-input',
  standalone: true,
  template: `
    <div class="money-input" [class.disabled]="disabled">
      <span class="money-prefix">Rp</span>
      <input #inputEl type="text" inputmode="numeric" class="money-control"
             [placeholder]="placeholder" [disabled]="disabled"
             (input)="onInput($event)" (blur)="onTouched()">
    </div>
  `,
  styles: [`
    :host { display: block; }
    .money-input {
      display: flex; align-items: stretch; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      background: #fff; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .money-input:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .money-input.disabled { background: var(--color-bg-alt); cursor: not-allowed; }
    .money-prefix {
      display: flex; align-items: center; padding: 0 12px; font-weight: 700; color: var(--color-text-secondary);
      border-right: 1px solid var(--color-border); font-family: var(--font-body); flex-shrink: 0;
    }
    .money-control {
      flex: 1; min-width: 0; border: none; background: transparent; padding: 12px 14px;
      font-size: .95rem; font-family: var(--font-body); color: var(--color-text);
    }
    .money-control:focus { outline: none; }
    .money-control:disabled { cursor: not-allowed; color: var(--color-muted); }
  `],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInputComponent), multi: true },
  ],
})
export class MoneyInputComponent implements ControlValueAccessor {
  @ViewChild('inputEl') private inputEl?: ElementRef<HTMLInputElement>;

  @Input() placeholder = '0';
  @Input() disabled = false;

  // Value selalu `number` murni (bukan `number | null`) — field kosong
  // di-treat sebagai 0, sama seperti semantik lama `type="number"` yang
  // digantikannya di semua form ini (validasi form tetap cek `!amount ||
  // amount <= 0`, jadi 0 vs kosong tidak pernah dibedakan di sisi validasi).
  private onChange: (value: number) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    const caret = el.selectionStart ?? el.value.length;
    const prevLen = el.value.length;
    const formatted = num ? formatThousands(num) : '';
    el.value = formatted;
    const diff = formatted.length - prevLen;
    try { el.setSelectionRange(caret + diff, caret + diff); } catch { /* ignore */ }
    this.onChange(num);
  }

  writeValue(value: number | null): void {
    const formatted = value ? formatThousands(value) : '';
    if (this.inputEl) this.inputEl.nativeElement.value = formatted;
  }
  registerOnChange(fn: (value: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
