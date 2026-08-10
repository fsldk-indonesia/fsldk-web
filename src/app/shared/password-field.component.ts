import { Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from './icon.component';

/** Input kata sandi dengan tombol mata buka/tutup — dipakai di halaman auth
 *  (login, daftar, reset password) supaya pengguna bisa memeriksa apa yang
 *  mereka ketik sebelum submit, alih-alih hanya titik-titik buram. */
@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="password-field">
      <input
        class="form-control"
        [type]="visible() ? 'text' : 'password'"
        [placeholder]="placeholder"
        [disabled]="disabled"
        required
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
      >
      <button
        type="button"
        class="password-toggle"
        tabindex="-1"
        (click)="visible.set(!visible())"
        [attr.aria-label]="visible() ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
      >
        <app-icon [name]="visible() ? 'eye-off' : 'eye'" [size]="16" />
      </button>
    </div>
  `,
  styles: [`
    .password-field { position: relative; }
    .password-field .form-control { padding-right: 42px; }
    .password-toggle {
      position: absolute; top: 50%; right: 5px; transform: translateY(-50%);
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      background: none; border: none; border-radius: var(--radius-full); color: var(--color-muted); cursor: pointer;
      transition: color var(--motion-fast) ease, background var(--motion-fast) ease;
    }
    .password-toggle:hover { color: var(--color-primary-dark); background: var(--color-bg-alt); }
    .password-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordFieldComponent), multi: true }],
})
export class PasswordFieldComponent implements ControlValueAccessor {
  @Input() placeholder = '';

  value = '';
  disabled = false;
  visible = signal(false);

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  writeValue(value: string): void { this.value = value ?? ''; }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
