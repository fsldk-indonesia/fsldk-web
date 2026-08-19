import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import {
  SubmissionFormDetail, FormVersionDetail, FormSection, FormField, FormOption,
  FieldType, FIELD_TYPE_OPTIONS, OPTION_FIELD_TYPES, SINGLE_CHOICE_FIELD_TYPES, ScoringMethod,
} from '../../entities/submission-form';
import { submissionFormPath } from '../../submission-form.path';
import { SubmissionFormBuilderPresenter } from './submission-form.builder.presenter';
import { SubmissionFormBuilderView } from './submission-form.builder.view';

interface SectionFormValue { sectionCode: string; sectionLabel: string; sortOrder: number; description: string; }

interface FieldFormValue {
  fieldCode: string; fieldLabel: string; fieldType: FieldType; isRequired: boolean; sortOrder: number; helpText: string;
  minLength: number | null; maxLength: number | null; min: number | null; max: number | null;
  conditionalOnFieldID: number | null; conditionalOperator: 'equals' | 'notEquals'; conditionalValue: string;
  useScoring: boolean; scoringMethod: ScoringMethod; minScore: number | null; maxScore: number | null; weight: number | null;
}

interface OptionFormValue { optionValue: string; optionLabel: string; sortOrder: number; isActive: boolean; score: number | null; }

const emptySectionForm = (sortOrder = 0): SectionFormValue => ({ sectionCode: '', sectionLabel: '', sortOrder, description: '' });
const emptyFieldForm = (sortOrder = 0): FieldFormValue => ({
  fieldCode: '', fieldLabel: '', fieldType: 'TEXT', isRequired: false, sortOrder, helpText: '',
  minLength: null, maxLength: null, min: null, max: null,
  conditionalOnFieldID: null, conditionalOperator: 'equals', conditionalValue: '',
  useScoring: false, scoringMethod: 'MANUAL', minScore: null, maxScore: null, weight: null,
});
const emptyOptionForm = (sortOrder = 0): OptionFormValue => ({ optionValue: '', optionLabel: '', sortOrder, isActive: true, score: null });

@Component({
  selector: 'app-submission-form-builder-page',
  standalone: true,
  templateUrl: './submission-form.builder.page.html',
  imports: [FormsModule, RouterLink, IconComponent, SelectComponent],
  providers: [SubmissionFormBuilderPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .88rem; margin-bottom: 10px; }
    .version-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
    .version-bar .app-select { width: 220px; }
    .section-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; margin-bottom: 16px; }
    .section-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; border-bottom: 1px solid var(--color-border); }
    .section-body { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    .field-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); }
    .field-row .field-meta { display: flex; flex-direction: column; gap: 3px; }
    .field-actions { display: flex; gap: 8px; align-items: center; }
    .option-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 520px; max-height: 86vh; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .link-danger[aria-disabled="true"] { color: var(--color-muted); cursor: not-allowed; pointer-events: none; }
  `],
})
export class SubmissionFormBuilderPage implements OnInit, SubmissionFormBuilderView {
  private presenter = inject(SubmissionFormBuilderPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  formID = Number(this.route.snapshot.paramMap.get('formID'));
  form = signal<SubmissionFormDetail | null>(null);
  version = signal<FormVersionDetail | null>(null);
  selectedVersionID = signal<number | null>(null);
  busy = signal(false);

  canManage = this.auth.hasPermission('submission_form.manage');

  versionOptions = signal<SelectOption[]>([]);

  showSectionForm = signal(false);
  sectionEditID: number | null = null;
  sectionForm: SectionFormValue = emptySectionForm();

  showFieldForm = signal(false);
  fieldEditID: number | null = null;
  fieldSectionID = 0;
  fieldForm: FieldFormValue = emptyFieldForm();
  fieldTypeOptions: SelectOption[] = FIELD_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  conditionalOperatorOptions: SelectOption[] = [
    { value: 'equals', label: 'Sama dengan' },
    { value: 'notEquals', label: 'Tidak sama dengan' },
  ];

  showOptionForm = signal(false);
  optionEditID: number | null = null;
  optionFieldID = 0;
  optionForm: OptionFormValue = emptyOptionForm();

  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });

  readonly submissionFormPath = submissionFormPath;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadForm(this.formID);
  }

  isOptionType(t: FieldType): boolean { return OPTION_FIELD_TYPES.includes(t); }
  isLengthType(t: FieldType): boolean { return t === 'TEXT' || t === 'TEXTAREA'; }
  isRangeType(t: FieldType): boolean { return t === 'NUMBER'; }
  isSingleChoice(t: FieldType): boolean { return SINGLE_CHOICE_FIELD_TYPES.includes(t); }
  scoringMethodOptions: SelectOption[] = [{ value: 'AUTOMATIC', label: 'Otomatis (dari pilihan)' }, { value: 'MANUAL', label: 'Manual (dinilai Puskomnas)' }];

  /** Total bobot seluruh field UseScoring pada version yang sedang dibuka —
   *  ditampilkan sebagai progress indikator menuju 100% sebelum publish
   *  ditolak backend karena validasi total weight (lihat PublishVersion). */
  totalWeight(): number {
    const v = this.version();
    if (!v) return 0;
    let total = 0;
    for (const s of v.sections) for (const f of s.fields) if (f.useScoring && f.weight != null) total += f.weight;
    return Math.round(total * 100) / 100;
  }

  /** Cari field (beserta konfigurasi scoring-nya) dari fieldID — dipakai modal
   *  opsi untuk menentukan apakah input Score perlu ditampilkan (hanya saat
   *  field induk useScoring && scoringMethod==='AUTOMATIC'). */
  findField(fieldID: number): FormField | undefined {
    const v = this.version();
    if (!v) return undefined;
    for (const s of v.sections) {
      const f = s.fields.find((x) => x.fieldID === fieldID);
      if (f) return f;
    }
    return undefined;
  }

  isAutomaticScoringField(fieldID: number): boolean {
    const f = this.findField(fieldID);
    return !!f && f.useScoring && f.scoringMethod === 'AUTOMATIC';
  }

  otherFieldOptions(excludeFieldID: number | null): SelectOption[] {
    const v = this.version();
    if (!v) return [];
    const out: SelectOption[] = [];
    for (const s of v.sections) {
      for (const f of s.fields) {
        if (f.fieldID !== excludeFieldID) out.push({ value: f.fieldID, label: `${s.sectionLabel} — ${f.fieldLabel}` });
      }
    }
    return out;
  }

  selectVersion(versionID: number): void {
    this.selectedVersionID.set(versionID);
    this.presenter.loadVersion(versionID);
  }

  onVersionOptionChange(value: unknown): void {
    this.selectVersion(Number(value));
  }

  newVersion(): void {
    this.presenter.createVersion(this.formID, this.selectedVersionID(), (versionID) => this.selectVersion(versionID));
  }

  async publish(): Promise<void> {
    const v = this.version();
    if (!v) return;
    const ok = await this.alert.confirm('Publikasikan versi ini? Struktur form tidak dapat diubah lagi setelah dipublikasikan.', {
      title: 'Publikasikan Versi', confirmLabel: 'Ya, Publikasikan',
    });
    if (!ok) return;
    this.presenter.publishVersion(v.versionID, this.formID);
  }

  // ---------- Section ----------
  openCreateSection(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.sectionEditID = null;
    this.sectionForm = emptySectionForm((this.version()?.sections.length ?? 0) + 1);
    this.showSectionForm.set(true);
  }
  openEditSection(s: FormSection, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.sectionEditID = s.sectionID;
    this.sectionForm = { sectionCode: s.sectionCode, sectionLabel: s.sectionLabel, sortOrder: s.sortOrder, description: s.description ?? '' };
    this.showSectionForm.set(true);
  }
  closeSectionForm(): void { this.showSectionForm.set(false); }
  saveSection(): void {
    const v = this.version();
    if (!v) return;
    const body: Record<string, unknown> = {
      sectionLabel: this.sectionForm.sectionLabel, sortOrder: this.sectionForm.sortOrder, description: this.sectionForm.description,
    };
    if (!this.sectionEditID) body['sectionCode'] = this.sectionForm.sectionCode;
    this.presenter.saveSection(v.versionID, this.sectionEditID, body);
    this.closeSectionForm();
  }
  async removeSection(s: FormSection, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus section "${s.sectionLabel}" beserta seluruh field di dalamnya?`, {
      title: 'Hapus Section', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.removeSection(s.sectionID);
  }

  // ---------- Field ----------
  openCreateField(sectionID: number, sortOrder: number, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.fieldEditID = null;
    this.fieldSectionID = sectionID;
    this.fieldForm = emptyFieldForm(sortOrder);
    this.showFieldForm.set(true);
  }
  openEditField(f: FormField, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.fieldEditID = f.fieldID;
    this.fieldSectionID = f.sectionID;
    const rule = (f.validationRule ?? {}) as Record<string, number | undefined>;
    this.fieldForm = {
      fieldCode: f.fieldCode, fieldLabel: f.fieldLabel, fieldType: f.fieldType, isRequired: f.isRequired,
      sortOrder: f.sortOrder, helpText: f.helpText ?? '',
      minLength: rule['minLength'] ?? null, maxLength: rule['maxLength'] ?? null,
      min: rule['min'] ?? null, max: rule['max'] ?? null,
      conditionalOnFieldID: f.conditionalOnFieldID ?? null,
      conditionalOperator: f.conditionalRule?.operator ?? 'equals',
      conditionalValue: f.conditionalRule?.value ?? '',
      useScoring: f.useScoring, scoringMethod: f.scoringMethod ?? 'MANUAL',
      minScore: f.minScore ?? null, maxScore: f.maxScore ?? null, weight: f.weight ?? null,
    };
    this.showFieldForm.set(true);
  }
  closeFieldForm(): void { this.showFieldForm.set(false); }
  saveField(): void {
    const validationRule: Record<string, number> = {};
    if (this.isLengthType(this.fieldForm.fieldType)) {
      if (this.fieldForm.minLength != null) validationRule['minLength'] = this.fieldForm.minLength;
      if (this.fieldForm.maxLength != null) validationRule['maxLength'] = this.fieldForm.maxLength;
    }
    if (this.isRangeType(this.fieldForm.fieldType)) {
      if (this.fieldForm.min != null) validationRule['min'] = this.fieldForm.min;
      if (this.fieldForm.max != null) validationRule['max'] = this.fieldForm.max;
    }
    const conditionalRule = this.fieldForm.conditionalOnFieldID
      ? { operator: this.fieldForm.conditionalOperator, value: this.fieldForm.conditionalValue }
      : null;
    const body: Record<string, unknown> = {
      fieldLabel: this.fieldForm.fieldLabel, fieldType: this.fieldForm.fieldType, isRequired: this.fieldForm.isRequired,
      sortOrder: this.fieldForm.sortOrder, helpText: this.fieldForm.helpText,
      validationRule: Object.keys(validationRule).length ? validationRule : null,
      conditionalOnFieldID: this.fieldForm.conditionalOnFieldID,
      conditionalRule,
      useScoring: this.fieldForm.useScoring,
      scoringMethod: this.fieldForm.useScoring ? this.fieldForm.scoringMethod : null,
      minScore: this.fieldForm.useScoring ? this.fieldForm.minScore : null,
      maxScore: this.fieldForm.useScoring ? this.fieldForm.maxScore : null,
      weight: this.fieldForm.useScoring ? this.fieldForm.weight : null,
    };
    if (!this.fieldEditID) body['fieldCode'] = this.fieldForm.fieldCode;
    this.presenter.saveField(this.fieldSectionID, this.fieldEditID, body);
    this.closeFieldForm();
  }
  async removeField(f: FormField, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus field "${f.fieldLabel}"?`, {
      title: 'Hapus Field', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.removeField(f.fieldID);
  }

  // ---------- Option ----------
  openCreateOption(fieldID: number, sortOrder: number, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.optionEditID = null;
    this.optionFieldID = fieldID;
    this.optionForm = emptyOptionForm(sortOrder);
    this.showOptionForm.set(true);
  }
  openEditOption(o: FormOption, fieldID: number, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.optionEditID = o.optionID;
    this.optionFieldID = fieldID;
    this.optionForm = { optionValue: o.optionValue, optionLabel: o.optionLabel, sortOrder: o.sortOrder, isActive: o.isActive, score: o.score ?? null };
    this.showOptionForm.set(true);
  }
  closeOptionForm(): void { this.showOptionForm.set(false); }
  saveOption(): void {
    this.presenter.saveOption(this.optionFieldID, this.optionEditID, this.optionForm);
    this.closeOptionForm();
  }
  async removeOption(o: FormOption, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus pilihan "${o.optionLabel}"?`, {
      title: 'Hapus Pilihan', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.removeOption(o.optionID);
  }

  // ---------- View ----------
  setForm(form: SubmissionFormDetail): void {
    this.form.set(form);
    this.versionOptions.set(form.versions.map((v) => ({
      value: v.versionID, label: `Versi ${v.versionNumber} — ${v.status}`,
    })));
    if (this.selectedVersionID() === null && form.versions.length > 0) {
      const draft = form.versions.find((v) => v.status === 'DRAFT');
      this.selectVersion((draft ?? form.versions[form.versions.length - 1]).versionID);
    }
  }
  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  reload(): void {
    const v = this.selectedVersionID();
    if (v) this.presenter.loadVersion(v);
  }
}
