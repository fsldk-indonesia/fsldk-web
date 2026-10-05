import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
  Output, SimpleChanges, ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { ColorPickerComponent } from '../../../../shared/color-picker.component';
import {
  FSLDK_LOGO_URL, QR_BG_SWATCHES, QR_DEFAULT_BG, QR_DEFAULT_FG, QR_FG_SWATCHES,
  QR_ICON_PRESETS, QrIconPreset, composePresetIconDataUrl, renderQrPreview,
} from '../../qrcode-preview';

type IconFilterCategory = 'semua' | 'umum' | 'sosial';

export interface QrcodeStyleValue {
  foregroundColor: string;
  backgroundColor: string;
  centerIconURL: string;
  centerIconKey: string;
  captionText: string;
}

export const defaultQrcodeStyle = (): QrcodeStyleValue => ({
  foregroundColor: QR_DEFAULT_FG,
  backgroundColor: QR_DEFAULT_BG,
  centerIconURL: '',
  centerIconKey: '',
  captionText: '',
});

type IconMode = 'none' | 'preset' | 'custom';

/**
 * Editor kustomisasi gambar QR (warna, ikon tengah, caption) + pratinjau
 * langsung — dipakai bersama modal CMS "Buat/Ubah QR Code" dan halaman publik
 * "Ajukan QR Code". Ikon preset dikomposisi jadi PNG data-URI di sini (warna
 * outline & border kotak ikut warna QR), disimpan di `centerIconURL`; backend
 * menempelnya apa adanya. `allowCustomUpload=false` untuk halaman publik
 * (endpoint /uploads butuh login).
 */
@Component({
  selector: 'app-qrcode-style-editor',
  standalone: true,
  imports: [FormsModule, IconComponent, ImageUploadComponent, ColorPickerComponent],
  template: `
    <div class="editor-grid">
      <div class="fields">
        <div class="form-group">
          <span class="qse-label"><app-icon name="eye-dropper" [size]="12" /> Warna QR</span>
          <div class="swatches">
            @for (s of fgSwatches; track s.value) {
              <button type="button" class="swatch" [class.active]="eq(value.foregroundColor, s.value)"
                      [style.background]="s.value" [title]="s.label" (click)="patch({ foregroundColor: s.value })">
                @if (eq(value.foregroundColor, s.value)) { <app-icon name="check" [size]="13" class="swatch-check" /> }
              </button>
            }
            <app-color-picker [ngModel]="value.foregroundColor" (ngModelChange)="patch({ foregroundColor: $event })" title="Warna QR lain" />
          </div>
        </div>

        <div class="form-group">
          <span class="qse-label"><app-icon name="eye-dropper" [size]="12" /> Warna Latar</span>
          <div class="swatches">
            @for (s of bgSwatches; track s.value) {
              <button type="button" class="swatch" [class.active]="eq(value.backgroundColor, s.value)"
                      [style.background]="s.value" [title]="s.label" (click)="patch({ backgroundColor: s.value })">
                @if (eq(value.backgroundColor, s.value)) { <app-icon name="check" [size]="13" class="swatch-check dark" /> }
              </button>
            }
            <app-color-picker [ngModel]="value.backgroundColor" (ngModelChange)="patch({ backgroundColor: $event })" title="Warna latar lain" />
          </div>
        </div>

        <div class="form-group">
          <span class="qse-label"><app-icon name="qr-code" [size]="12" /> Ikon Tengah (opsional)</span>

          <div class="icon-filter-row">
            <button type="button" class="icon-filter-chip" [class.active]="iconCategory === 'semua'" (click)="iconCategory = 'semua'">Semua</button>
            <button type="button" class="icon-filter-chip" [class.active]="iconCategory === 'umum'" (click)="iconCategory = 'umum'">Umum</button>
            <button type="button" class="icon-filter-chip" [class.active]="iconCategory === 'sosial'" (click)="iconCategory = 'sosial'">Media Sosial</button>
          </div>

          <div class="icon-picker">
            @if (iconCategory === 'semua') {
              <button type="button" class="icon-opt" [class.active]="iconMode === 'none'" (click)="selectNone()">
                <span class="icon-opt-glyph none">&times;</span>
                <span class="icon-opt-label">Tanpa</span>
                @if (iconMode === 'none') { <app-icon name="check" [size]="10" class="icon-opt-check" /> }
              </button>
            }
            @for (p of filteredIconPresets(); track p.key) {
              <button type="button" class="icon-opt" [class.active]="iconMode === 'preset' && iconPreset === p.key"
                      [title]="p.label" (click)="selectPreset(p.key)">
                <span class="icon-opt-glyph">
                  @if (p.key === 'fsldk') { <img [src]="fsldkLogoUrl" alt="FSLDK" width="20" height="20"> }
                  @else { <app-icon [name]="p.icon" [size]="18" /> }
                </span>
                <span class="icon-opt-label">{{ p.label }}</span>
                @if (iconMode === 'preset' && iconPreset === p.key) { <app-icon name="check" [size]="10" class="icon-opt-check" /> }
              </button>
            }
            @if (allowCustomUpload && iconCategory === 'semua') {
              <button type="button" class="icon-opt" [class.active]="iconMode === 'custom'" (click)="selectCustom()">
                <span class="icon-opt-glyph"><app-icon name="download" [size]="17" /></span>
                <span class="icon-opt-label">Unggah</span>
                @if (iconMode === 'custom') { <app-icon name="check" [size]="10" class="icon-opt-check" /> }
              </button>
            }
          </div>
          @if (iconMode === 'custom' && allowCustomUpload) {
            <div class="custom-upload">
              <app-image-upload [value]="value.centerIconURL || null" (valueChange)="onCustomUpload($event)" />
            </div>
          }
          <p class="form-hint">
            Ikon preset otomatis mengikuti warna QR (outline &amp; border kotak) di dalam kotak putih ber-radius.
            @if (allowCustomUpload) {
              Untuk "Unggah", pakai gambar <strong>persegi</strong> (1:1, mis. 512&times;512 px) — gambar non-persegi tidak digepengkan, hanya diperkecil.
            }
          </p>
        </div>

        <div class="form-group">
          <span class="qse-label"><app-icon name="align-left" [size]="12" /> Teks di Bawah QR (opsional)</span>
          <input class="form-control" [ngModel]="value.captionText" (ngModelChange)="patch({ captionText: $event })"
                 maxlength="120" placeholder="mis. Scan untuk info lengkap">
        </div>
      </div>

      <div class="preview">
        <span class="qse-label qse-label-center">Pratinjau Langsung</span>
        <div class="preview-frame">
          <canvas #canvas width="240" height="240"></canvas>
        </div>
        @if (previewNote) { <p class="form-hint preview-note">{{ previewNote }}</p> }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .editor-grid { display: grid; grid-template-columns: 1fr 240px; gap: 28px; align-items: start; }
    @media (max-width: 620px) { .editor-grid { grid-template-columns: 1fr; } }

    .qse-label { display: flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-primary-dark); margin-bottom: 10px; }
    .qse-label app-icon { flex-shrink: 0; opacity: .85; }
    .qse-label-center { justify-content: center; }

    .swatches { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .swatch {
      width: 34px; height: 34px; border-radius: 10px; border: 2px solid var(--color-border); cursor: pointer; padding: 0;
      position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 2px rgba(20,23,26,.06); transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .swatch:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(20,23,26,.12); }
    .swatch.active { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .swatch-check { color: #fff; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
    .swatch-check.dark { color: var(--color-primary-dark); filter: none; }

    .icon-filter-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .icon-filter-chip {
      padding: 5px 13px; border-radius: var(--radius-full); border: 1.5px solid var(--color-border);
      background: #fff; font-size: .74rem; font-weight: 700; color: var(--color-text-secondary); cursor: pointer;
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .icon-filter-chip:hover { border-color: var(--color-primary); }
    .icon-filter-chip.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }

    .icon-picker { display: flex; flex-wrap: wrap; gap: 10px; }
    .icon-opt {
      position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 68px; padding: 12px 4px 10px;
      border: 1.5px solid var(--color-border); border-radius: 14px; background: var(--color-bg-warm); cursor: pointer;
      transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease, background var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .icon-opt:hover { border-color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 6px 14px rgba(20,23,26,.1); }
    .icon-opt.active { border-color: var(--color-primary); background: var(--color-primary-soft); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .icon-opt-glyph { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); }
    .icon-opt-glyph.none { font-size: 20px; line-height: 1; }
    .icon-opt.active .icon-opt-glyph { color: var(--color-primary-dark); }
    .icon-opt-label { font-size: .68rem; font-weight: 600; color: var(--color-text-secondary); }
    .icon-opt-check {
      position: absolute; top: -5px; right: -5px; width: 17px; height: 17px; border-radius: 50%;
      background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 2px #fff;
    }
    .custom-upload { margin-top: 12px; }

    .preview { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .preview-frame { padding: 10px; border-radius: 16px; background: linear-gradient(145deg, var(--color-primary-soft), #fff); box-shadow: inset 0 0 0 1px var(--color-border); }
    .preview canvas { display: block; border-radius: 8px; max-width: 100%; box-shadow: 0 6px 18px rgba(20,23,26,.1); }
    .preview-note { text-align: center; }
  `],
})
export class QrcodeStyleEditorComponent implements AfterViewInit, OnChanges {
  @Input() value: QrcodeStyleValue = defaultQrcodeStyle();
  @Input() previewContent = '';
  @Input() previewNote = '';
  @Input() allowCustomUpload = true;
  @Output() valueChange = new EventEmitter<QrcodeStyleValue>();

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly fgSwatches = QR_FG_SWATCHES;
  readonly bgSwatches = QR_BG_SWATCHES;
  readonly iconPresets = QR_ICON_PRESETS;
  readonly fsldkLogoUrl = FSLDK_LOGO_URL;

  iconMode: IconMode = 'none';
  iconPreset: QrIconPreset | '' = '';
  iconCategory: IconFilterCategory = 'semua';

  filteredIconPresets(): typeof QR_ICON_PRESETS {
    if (this.iconCategory === 'semua') return this.iconPresets;
    return this.iconPresets.filter((p) => p.category === this.iconCategory);
  }

  private customImg: HTMLImageElement | null = null;
  private fsldkImg: HTMLImageElement | null = null;
  private renderQueued = false;
  private viewReady = false;
  /** True right after we emit our own patch — the parent's `[(value)]` echoes
   *  it straight back down as a new `@Input() value`, which would otherwise
   *  make the next ngOnChanges re-derive iconMode from data and stomp it back
   *  to 'none' (a fresh 'custom' selection has empty centerIconKey/URL until
   *  a file is actually uploaded, indistinguishable from "no icon" by value
   *  alone) — this is what made "Unggah" look unclickable/unusable: the
   *  dropzone mounted for a tick then got unmounted by the echoed value. */
  private suppressNextSync = false;

  eq(a: string, b: string): boolean { return (a || '').toLowerCase() === b.toLowerCase(); }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const img = new Image();
    img.onload = () => { this.fsldkImg = img; this.scheduleRender(); };
    img.src = this.fsldkLogoUrl;
    this.syncModeFromValue();
    this.scheduleRender();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (!this.viewReady) return;
    if (ch['value'] && !ch['value'].firstChange) {
      if (this.suppressNextSync) { this.suppressNextSync = false; }
      else { this.syncModeFromValue(); }
      this.scheduleRender();
    } else if (ch['previewContent'] && !ch['previewContent'].firstChange) this.scheduleRender();
  }

  /** Menetapkan iconMode/iconPreset dari `value` (mis. saat form edit dibuka). */
  private syncModeFromValue(): void {
    if (this.value.centerIconKey) {
      this.iconMode = 'preset';
      this.iconPreset = this.value.centerIconKey as QrIconPreset;
      this.customImg = null;
    } else if (this.value.centerIconURL) {
      this.iconMode = 'custom';
      this.iconPreset = '';
      this.loadCustom(this.value.centerIconURL);
    } else {
      this.iconMode = 'none';
      this.iconPreset = '';
      this.customImg = null;
    }
  }

  patch(p: Partial<QrcodeStyleValue>): void {
    this.value = { ...this.value, ...p };
    // Warna QR berubah sementara preset aktif → komposisi ulang data-URI ikon.
    if ('foregroundColor' in p && this.iconMode === 'preset' && this.iconPreset) {
      this.value.centerIconURL = composePresetIconDataUrl(this.iconPreset, this.value.foregroundColor, this.fsldkImg);
    }
    this.suppressNextSync = true;
    this.valueChange.emit(this.value);
    this.scheduleRender();
  }

  selectNone(): void {
    this.iconMode = 'none';
    this.iconPreset = '';
    this.customImg = null;
    this.patch({ centerIconURL: '', centerIconKey: '' });
  }

  selectPreset(key: QrIconPreset): void {
    this.iconMode = 'preset';
    this.iconPreset = key;
    this.customImg = null;
    this.patch({
      centerIconKey: key,
      centerIconURL: composePresetIconDataUrl(key, this.value.foregroundColor, this.fsldkImg),
    });
  }

  selectCustom(): void {
    this.iconMode = 'custom';
    this.iconPreset = '';
    this.patch({ centerIconKey: '', centerIconURL: this.value.centerIconURL.startsWith('data:') ? '' : this.value.centerIconURL });
  }

  onCustomUpload(url: string): void {
    this.loadCustom(url);
    this.patch({ centerIconURL: url || '', centerIconKey: '' });
  }

  private loadCustom(url: string): void {
    if (!url || url.startsWith('data:')) { this.customImg = null; this.scheduleRender(); return; }
    const img = new Image();
    img.onload = () => { this.customImg = img; this.scheduleRender(); };
    img.onerror = () => { this.customImg = null; this.scheduleRender(); };
    img.src = url;
  }

  private scheduleRender(): void {
    if (this.renderQueued) return;
    this.renderQueued = true;
    setTimeout(() => {
      this.renderQueued = false;
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;
      void renderQrPreview(canvas, {
        content: this.previewContent,
        foregroundColor: this.value.foregroundColor,
        backgroundColor: this.value.backgroundColor,
        captionText: this.value.captionText,
        iconImg: this.iconMode === 'custom' ? this.customImg : null,
        preset: this.iconMode === 'preset' && this.iconPreset
          ? { key: this.iconPreset, fsldkImg: this.fsldkImg }
          : undefined,
      });
    }, 60);
  }
}
