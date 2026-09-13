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
          <label class="form-label">Warna QR</label>
          <div class="swatches">
            @for (s of fgSwatches; track s.value) {
              <button type="button" class="swatch" [class.active]="eq(value.foregroundColor, s.value)"
                      [style.background]="s.value" [title]="s.label" (click)="patch({ foregroundColor: s.value })"></button>
            }
            <app-color-picker [ngModel]="value.foregroundColor" (ngModelChange)="patch({ foregroundColor: $event })" title="Warna QR lain" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Warna Latar</label>
          <div class="swatches">
            @for (s of bgSwatches; track s.value) {
              <button type="button" class="swatch" [class.active]="eq(value.backgroundColor, s.value)"
                      [style.background]="s.value" [title]="s.label" (click)="patch({ backgroundColor: s.value })"></button>
            }
            <app-color-picker [ngModel]="value.backgroundColor" (ngModelChange)="patch({ backgroundColor: $event })" title="Warna latar lain" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ikon Tengah (opsional)</label>
          <div class="icon-picker">
            <button type="button" class="icon-opt" [class.active]="iconMode === 'none'" (click)="selectNone()">
              <span class="icon-opt-glyph none">&times;</span>
              <span class="icon-opt-label">Tanpa</span>
            </button>
            @for (p of iconPresets; track p.key) {
              <button type="button" class="icon-opt" [class.active]="iconMode === 'preset' && iconPreset === p.key"
                      [title]="p.label" (click)="selectPreset(p.key)">
                <span class="icon-opt-glyph">
                  @if (p.key === 'fsldk') { <img [src]="fsldkLogoUrl" alt="FSLDK" width="18" height="18"> }
                  @else { <app-icon [name]="p.icon" [size]="16" /> }
                </span>
                <span class="icon-opt-label">{{ p.label }}</span>
              </button>
            }
            @if (allowCustomUpload) {
              <button type="button" class="icon-opt" [class.active]="iconMode === 'custom'" (click)="selectCustom()">
                <span class="icon-opt-glyph"><app-icon name="download" [size]="15" /></span>
                <span class="icon-opt-label">Unggah</span>
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
          <label class="form-label">Teks di Bawah QR (opsional)</label>
          <input class="form-control" [ngModel]="value.captionText" (ngModelChange)="patch({ captionText: $event })"
                 maxlength="120" placeholder="mis. Scan untuk info lengkap">
        </div>
      </div>

      <div class="preview">
        <label class="form-label">Pratinjau</label>
        <canvas #canvas width="240" height="240"></canvas>
        @if (previewNote) { <p class="form-hint">{{ previewNote }}</p> }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .editor-grid { display: grid; grid-template-columns: 1fr 240px; gap: 24px; align-items: start; }
    @media (max-width: 620px) { .editor-grid { grid-template-columns: 1fr; } }
    .swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .swatch { width: 30px; height: 30px; border-radius: 8px; border: 2px solid var(--color-border); cursor: pointer; padding: 0; position: relative; overflow: hidden; }
    .swatch.active { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-soft); }
    .icon-picker { display: flex; flex-wrap: wrap; gap: 8px; }
    .icon-opt { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 60px; padding: 8px 4px; border: 1.5px solid var(--color-border); border-radius: 10px; background: var(--color-bg-warm); cursor: pointer; }
    .icon-opt:hover { border-color: var(--color-primary); }
    .icon-opt.active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .icon-opt-glyph { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); }
    .icon-opt-glyph.none { font-size: 18px; line-height: 1; }
    .icon-opt-label { font-size: .68rem; color: var(--color-text-secondary); }
    .custom-upload { margin-top: 12px; }
    .preview { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .preview canvas { border: 1px solid var(--color-border); border-radius: 8px; max-width: 100%; }
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

  private customImg: HTMLImageElement | null = null;
  private fsldkImg: HTMLImageElement | null = null;
  private renderQueued = false;
  private viewReady = false;

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
    if (ch['value'] && !ch['value'].firstChange) { this.syncModeFromValue(); this.scheduleRender(); }
    else if (ch['previewContent'] && !ch['previewContent'].firstChange) this.scheduleRender();
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
