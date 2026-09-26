import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { GSheetStatus } from '../../entities/dynamic-form';
import { dynamicFormPath } from '../../dynamicform.path';
import {
  DynamicFormFormPresenter, DynamicFormFormValue, emptyDynamicFormForm,
} from './dynamicform.form.presenter';
import { DynamicFormFormView } from './dynamicform.form.view';

@Component({
  selector: 'app-dynamicform-form-page',
  standalone: true,
  templateUrl: './dynamicform.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, DateTimePickerComponent],
  providers: [DynamicFormFormPresenter],
  styles: [`
    .page-head { margin: 0 0 24px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-control-lg { font-weight: 700; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }

    .switch { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
    .switch input[type="checkbox"] { margin-top: 3px; }
    .switch-label { font-size: .92rem; }
    .switch.is-disabled { cursor: not-allowed; opacity: .6; }

    .info-box { display: flex; gap: 10px; align-items: flex-start; background: var(--color-primary-soft); color: var(--color-primary-dark); border-radius: var(--radius-xs); padding: 12px 14px; margin-bottom: 18px; font-size: .84rem; line-height: 1.5; }
    .info-box app-icon { flex-shrink: 0; margin-top: 1px; }
    .gsheet-status { background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: var(--radius-xs); padding: 14px; margin-top: 4px; font-size: .88rem; }
    .gsheet-status p { margin: 0 0 6px; }
    .gsheet-status p:last-child { margin-bottom: 0; }
    .gsheet-error { color: var(--color-warning); }
  `],
})
export class DynamicFormFormPage implements OnInit, DynamicFormFormView {
  private presenter = inject(DynamicFormFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly path = dynamicFormPath;
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat dynamicform.routes.ts), pola
  // sama seperti Perpustakaan/Event/Berita. Builder field tetap terpisah
  // (bukan bagian dari "form" ini), jadi tidak ikut kena mode baca-saja.
  isReadonly = false;
  saving = signal(false);
  form: DynamicFormFormValue = structuredClone(emptyDynamicFormForm);
  gsheet = signal<GSheetStatus | null>(null);
  gsheetAvailable = signal(true);

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail pengaturan formulir ini.';
    return this.editId ? 'Perbarui pengaturan formulir yang sudah ada.' : 'Isi judul & pengaturan dasar, lalu lanjut ke Builder untuk menyusun field-nya.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.editId = +id; this.presenter.loadForEdit(this.editId); }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  connect(): void { if (this.editId) this.presenter.gsheetConnect(this.editId); }
  resync(): void { if (this.editId) this.presenter.gsheetResync(this.editId); }
  disconnect(): void { if (this.editId) this.presenter.gsheetDisconnect(this.editId); }

  setForm(form: DynamicFormFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  setGsheetStatus(status: GSheetStatus): void { this.gsheet.set(status); this.form.gsheetEnabled = status.enabled; }
  setGsheetAvailable(available: boolean): void { this.gsheetAvailable.set(available); }
  navigateToIndex(): void { this.router.navigate([this.path.index]); }
  navigateToBuilder(id: number): void { this.router.navigate([this.path.builder(id)]); }
}
