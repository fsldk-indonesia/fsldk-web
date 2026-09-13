import { Component, ElementRef, Input, OnDestroy, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from './icon.component';

interface Rgb { r: number; g: number; b: number }
interface Hsv { h: number; s: number; v: number }

function clamp(n: number, min: number, max: number): number { return Math.min(max, Math.max(min, n)); }

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const sn = s / 100, vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/**
 * Pemetik warna kustom (pengganti `<input type="color">` bawaan browser, yang
 * tampilannya beda-beda tiap OS/browser dan tidak bisa direstyle sama sekali)
 * — area saturation/value + slider hue + input HEX/RGB, dirender sendiri
 * supaya konsisten dengan desain form lain (pola sama seperti SelectComponent:
 * popup `position:fixed` dropup-aware, ControlValueAccessor, document
 * capture-phase listener untuk tutup-saat-klik-luar).
 */
@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button type="button" class="cp-swatch" [class.disabled]="disabled" [style.background]="value" [disabled]="disabled"
            (click)="toggle()" [attr.aria-expanded]="open()" [attr.title]="open() ? null : title">
      <span class="cp-plus">+</span>
    </button>

    <div class="cp-panel" [class.open]="open()" [style.top.px]="pos().top" [style.left.px]="pos().left" (click)="$event.stopPropagation()">
      <div #areaEl class="cp-area" [style.background]="hueBackground()" (pointerdown)="onAreaDown($event)">
        <div class="cp-area-white"></div>
        <div class="cp-area-black"></div>
        <div class="cp-area-thumb" [style.left.%]="hsv.s" [style.top.%]="100 - hsv.v"></div>
      </div>

      <div #hueEl class="cp-hue" (pointerdown)="onHueDown($event)">
        <div class="cp-hue-thumb" [style.left.%]="hsv.h / 360 * 100"></div>
      </div>

      <div class="cp-row">
        @if (eyedropperSupported) {
          <button type="button" class="cp-eyedrop" (click)="pickWithEyedropper()" title="Ambil warna dari layar">
            <app-icon name="eye-dropper" [size]="14" />
          </button>
        }
        <div class="cp-hex">
          <span>#</span>
          <input type="text" [value]="hexInput()" (input)="onHexInput($event)" (blur)="syncHexInput()" maxlength="6" spellcheck="false" aria-label="Kode warna HEX">
        </div>
      </div>
      <div class="cp-rgb">
        <label>R<input type="number" min="0" max="255" [value]="rgb.r" (change)="onRgbInput('r', $event)"></label>
        <label>G<input type="number" min="0" max="255" [value]="rgb.g" (change)="onRgbInput('g', $event)"></label>
        <label>B<input type="number" min="0" max="255" [value]="rgb.b" (change)="onRgbInput('b', $event)"></label>
      </div>
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-block; }
    .cp-swatch {
      width: 30px; height: 30px; border-radius: 8px; border: 2px solid var(--color-border);
      cursor: pointer; padding: 0; position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .cp-swatch.disabled { cursor: not-allowed; opacity: .6; }
    .cp-plus { font-size: 15px; font-weight: 700; color: #fff; mix-blend-mode: difference; pointer-events: none; }

    .cp-panel {
      position: fixed; z-index: 1000; width: 220px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); padding: 14px; display: flex; flex-direction: column; gap: 12px;
      opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-4px) scale(.98);
      transition: opacity .12s ease, transform .12s ease, visibility 0s linear .12s;
    }
    .cp-panel.open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1); transition: opacity .12s ease, transform .12s ease, visibility 0s linear 0s; }
    @media (prefers-reduced-motion: reduce) { .cp-panel { transition: none; } }

    .cp-area { position: relative; width: 100%; height: 130px; border-radius: var(--radius-xs); cursor: crosshair; touch-action: none; overflow: hidden; }
    .cp-area-white { position: absolute; inset: 0; background: linear-gradient(to right, #fff, transparent); }
    .cp-area-black { position: absolute; inset: 0; background: linear-gradient(to top, #000, transparent); }
    .cp-area-thumb {
      position: absolute; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff;
      box-shadow: 0 0 0 1px rgba(0,0,0,.35), var(--shadow-sm); transform: translate(-50%, -50%); pointer-events: none;
    }

    .cp-hue {
      position: relative; width: 100%; height: 14px; border-radius: var(--radius-full); cursor: pointer; touch-action: none;
      background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
    }
    .cp-hue-thumb {
      position: absolute; top: 50%; width: 18px; height: 18px; border-radius: 50%; background: #fff;
      border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.25), var(--shadow-sm);
      transform: translate(-50%, -50%); pointer-events: none;
    }

    .cp-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .cp-eyedrop {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-xs); border: 1px solid var(--color-border);
      background: var(--color-bg-warm); color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: border-color var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .cp-eyedrop:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .cp-hex {
      flex: 1; min-width: 0; display: flex; align-items: center; gap: 2px; padding: 0 10px; height: 32px;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff;
      font-family: var(--font-body); font-size: .85rem; color: var(--color-muted);
    }
    .cp-hex input { flex: 1; min-width: 0; border: none; outline: none; font: inherit; color: var(--color-text); text-transform: uppercase; padding: 0; }

    .cp-rgb { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .cp-rgb label { display: flex; flex-direction: column; gap: 3px; font-size: .68rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }
    .cp-rgb input {
      width: 100%; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 6px;
      font: inherit; font-size: .85rem; color: var(--color-text);
    }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorPickerComponent), multi: true }],
})
export class ColorPickerComponent implements ControlValueAccessor, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  @Input() disabled = false;
  @Input() title = 'Warna lain';

  value = '#000000';
  open = signal(false);
  pos = signal({ top: 0, left: 0 });

  hsv: Hsv = { h: 0, s: 0, v: 0 };
  rgb: Rgb = { r: 0, g: 0, b: 0 };
  hexInput = signal('000000');

  readonly eyedropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  private onDocumentClick = (event: MouseEvent): void => {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) this.close();
  };
  private onViewportChange = (): void => { if (this.open()) this.reposition(); };
  private onKeydown = (event: KeyboardEvent): void => {
    if (this.open() && event.key === 'Escape') { event.preventDefault(); this.close(); }
  };

  constructor() {
    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('keydown', this.onKeydown, true);
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('keydown', this.onKeydown, true);
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
  }

  toggle(): void {
    if (this.disabled) return;
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    this.reposition();
    this.open.set(true);
  }

  private close(): void {
    this.open.set(false);
    this.onTouched();
  }

  /** Place the fixed panel below the swatch, or above it when space is short — same convention as SelectComponent.reposition(). */
  private reposition(): void {
    const r = this.el.nativeElement.getBoundingClientRect();
    const gap = 8, panelH = 300, panelW = 220;
    const below = window.innerHeight - r.bottom - gap;
    const up = below < panelH && r.top - gap > below;
    let left = r.left;
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - 8 - panelW;
    this.pos.set({ top: up ? r.top - gap - panelH : r.bottom + gap, left: Math.max(8, left) });
  }

  hueBackground(): string { return `hsl(${this.hsv.h}, 100%, 50%)`; }

  private applyHsv(hsv: Hsv): void {
    this.hsv = hsv;
    this.rgb = hsvToRgb(hsv);
    this.value = rgbToHex(this.rgb);
    this.hexInput.set(this.value.slice(1));
    this.onChange(this.value);
  }

  private applyHex(hex: string): void {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    this.rgb = rgb;
    this.hsv = rgbToHsv(rgb);
    this.value = rgbToHex(rgb);
    this.hexInput.set(this.value.slice(1));
    this.onChange(this.value);
  }

  private dragArea(el: HTMLElement, event: PointerEvent): void {
    const rect = el.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const s = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100);
      const v = clamp(100 - ((ev.clientY - rect.top) / rect.height) * 100, 0, 100);
      this.applyHsv({ ...this.hsv, s, v });
    };
    move(event);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  onAreaDown(event: PointerEvent): void {
    if (this.disabled) return;
    this.dragArea(event.currentTarget as HTMLElement, event);
  }

  onHueDown(event: PointerEvent): void {
    if (this.disabled) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const h = clamp(((ev.clientX - rect.left) / rect.width) * 360, 0, 360);
      this.applyHsv({ ...this.hsv, h });
    };
    move(event);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  onHexInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/[^0-9a-f]/gi, '').slice(0, 6);
    this.hexInput.set(raw);
    if (raw.length === 6) this.applyHex(`#${raw}`);
  }
  /** Kembalikan kotak HEX ke nilai valid terakhir kalau ditinggal setengah jalan (mis. "a3"). */
  syncHexInput(): void { this.hexInput.set(this.value.slice(1)); }

  onRgbInput(channel: keyof Rgb, event: Event): void {
    const n = clamp(Math.round(Number((event.target as HTMLInputElement).value)), 0, 255);
    this.applyHsv(rgbToHsv({ ...this.rgb, [channel]: n }));
  }

  pickWithEyedropper(): void {
    // @ts-expect-error EyeDropper belum ada di lib.dom.d.ts TypeScript standar (API baru, Chrome/Edge only).
    const dropper = new window.EyeDropper();
    dropper.open().then((result: { sRGBHex: string }) => this.applyHex(result.sRGBHex)).catch(() => {});
  }

  writeValue(value: string): void {
    this.value = value || '#000000';
    const rgb = hexToRgb(this.value) ?? { r: 0, g: 0, b: 0 };
    this.rgb = rgb;
    this.hsv = rgbToHsv(rgb);
    this.hexInput.set(this.value.replace('#', ''));
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
