import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { MultiSelectComponent, MultiSelectOption } from './multi-select.component';
import { DateRangePickerComponent, DateRange } from './date-range-picker.component';
import { ReportFilterValue, EMPTY_REPORT_FILTER } from '../modules/report/entities/report';

export interface ReportFilterFieldDef {
  key: 'statuses' | 'provinces' | 'cities' | 'puskomdaIDs' | 'levelCodes';
  label: string;
  options: MultiSelectOption[];
}

/** Grid filter SELALU TERLIHAT (bukan popover) dipakai Laporan Levelisasi &
 *  Pendataan — satu label di atas tiap field, field disusun flex-wrap, lalu
 *  tombol Show Report/Download Report (TechSpec-Report-Revamp.md §5.3).
 *  Field multi-select mana saja yang tampil ditentukan [fields] (Levelisasi
 *  dapat field Level, Pendataan tidak — DL-4). Tidak auto-apply: perubahan
 *  field hanya mengubah state lokal, baru dikirim ke host saat tombol
 *  Show/Download ditekan (sama pola dengan app-search-filter-sort). */
@Component({
  selector: 'app-report-filter-bar',
  standalone: true,
  imports: [FormsModule, IconComponent, MultiSelectComponent, DateRangePickerComponent],
  template: `
    <div class="rfb-grid">
      <div class="rfb-field">
        <label class="form-label">Periode</label>
        <app-date-range-picker [from]="draft.dateFrom" [to]="draft.dateTo" placeholder="Pilih rentang tanggal" (rangeChange)="onDateRange($event)" />
      </div>
      @for (f of fields; track f.key) {
        <div class="rfb-field">
          <label class="form-label">{{ f.label }}</label>
          <app-multi-select [options]="f.options" [selected]="draft[f.key]" [placeholder]="'Semua ' + f.label" [searchable]="f.options.length > 8" (selectedChange)="onFieldChange(f.key, $event)" />
        </div>
      }
    </div>
    <div class="rfb-actions">
      <button type="button" class="btn btn-primary" [disabled]="busy" (click)="showReport.emit(draft)">
        <app-icon name="file-text" [size]="14" /> Tampilkan Laporan
      </button>
      <button type="button" class="btn btn-primary" [disabled]="busy" (click)="downloadReport.emit(draft)">
        <app-icon name="download" [size]="14" /> Unduh Laporan
      </button>
    </div>
  `,
  styles: [`
    .rfb-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
    .rfb-field { min-width: 200px; flex: 1 1 200px; }
    .rfb-field .form-label { display: block; margin-bottom: 6px; font-weight: 600; font-size: .85rem; }
    .rfb-actions { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-border); padding-top: 16px; margin-bottom: 20px; }
  `],
})
export class ReportFilterBarComponent {
  @Input() fields: ReportFilterFieldDef[] = [];
  @Input() busy = false;
  @Output() showReport = new EventEmitter<ReportFilterValue>();
  @Output() downloadReport = new EventEmitter<ReportFilterValue>();

  draft: ReportFilterValue = { ...EMPTY_REPORT_FILTER };

  onDateRange(range: DateRange): void {
    this.draft = { ...this.draft, dateFrom: range.from ?? '', dateTo: range.to ?? '' };
  }

  onFieldChange(key: ReportFilterFieldDef['key'], selected: (string | number)[]): void {
    this.draft = { ...this.draft, [key]: selected.map(String) };
  }
}
