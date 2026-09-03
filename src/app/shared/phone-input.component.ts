import { Component, Input, forwardRef } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectComponent, SelectOption } from './select.component';

// Kode negara yang didukung dropdown — Indonesia default (mayoritas donor
// FSLDK), plus beberapa negara terdekat/relevan. "other" membuka input kode
// manual supaya nomor luar daftar ini tetap bisa diisi tanpa memblokir form.
const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '62', label: '🇮🇩 +62 (Indonesia)' },
  { value: '60', label: '🇲🇾 +60 (Malaysia)' },
  { value: '65', label: '🇸🇬 +65 (Singapura)' },
  { value: '966', label: '🇸🇦 +966 (Arab Saudi)' },
  { value: '971', label: '🇦🇪 +971 (Uni Emirat Arab)' },
  { value: 'other', label: 'Kode lainnya…' },
];

/**
 * Input nomor telepon dengan dropdown kode negara terpisah dari digit lokal
 * — sebelumnya satu <input> bebas format ("08xxx" vs "62xxx" tercampur)
 * yang membuat notifikasi WhatsApp gagal terkirim untuk nomor berformat
 * lokal (Kirimdev/WhatsApp Cloud API mewajibkan E.164 tanpa "+", ditolak
 * 400 invalid_field_value untuk awalan "0"). Value yang di-emit SUDAH
 * dalam format itu (mis. "62895394755672"), backend (kirimdev.SendTemplate)
 * tetap menormalisasi ulang sebagai lapisan pengaman kedua untuk data lama.
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule, SelectComponent],
  template: `
    <div class="phone-input">
      <app-select class="phone-code" [options]="countryOptions" [(ngModel)]="selectedCode" [disabled]="disabled" (ngModelChange)="emit()" />
      @if (selectedCode === 'other') {
        <input class="form-control phone-custom-code" [(ngModel)]="customCode" [disabled]="disabled" (ngModelChange)="emit()" placeholder="Kode">
      }
      <input class="form-control phone-local" [(ngModel)]="localNumber" [disabled]="disabled" (ngModelChange)="emit()" [placeholder]="placeholder">
    </div>
  `,
  styles: [`
    .phone-input { display: flex; gap: 8px; }
    .phone-code { flex: 0 0 168px; }
    .phone-custom-code { flex: 0 0 64px; }
    .phone-local { flex: 1; min-width: 0; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }],
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder = '895xxxxxxxx (tanpa 0 di depan)';
  @Input() disabled = false;

  readonly countryOptions = COUNTRY_OPTIONS;
  selectedCode: string = '62';
  customCode = '';
  localNumber = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  private resolvedCode(): string {
    return this.selectedCode === 'other' ? this.customCode.replace(/\D/g, '') : this.selectedCode;
  }

  emit(): void {
    const code = this.resolvedCode();
    const local = this.localNumber.replace(/\D/g, '').replace(/^0+/, '');
    const value = code && local ? code + local : '';
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: string): void {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) { this.selectedCode = '62'; this.customCode = ''; this.localNumber = ''; return; }
    const known = COUNTRY_OPTIONS.find((o) => o.value !== 'other' && digits.startsWith(o.value as string));
    if (known) {
      this.selectedCode = known.value as string;
      this.customCode = '';
      this.localNumber = digits.slice((known.value as string).length);
    } else {
      this.selectedCode = 'other';
      this.customCode = digits.slice(0, 2);
      this.localNumber = digits.slice(2);
    }
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
