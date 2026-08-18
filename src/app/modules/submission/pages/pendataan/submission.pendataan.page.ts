import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { PdfUploadComponent } from '../../../../shared/pdf-upload.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { FormField, FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionDetail, FORM_CODE_LEVELISASI, FORM_CODE_SENSUS_KADER, EDITABLE_STATUSES } from '../../entities/submission';
import { SubmissionPendataanPresenter } from './submission.pendataan.presenter';
import { SubmissionPendataanView } from './submission.pendataan.view';

interface AnswerDraft {
  text: string;
  number: number | null;
  date: string;
  optionID: number | null;
  optionIDs: number[];
  fileURL: string;
  fileName: string;
}

const emptyDraft = (): AnswerDraft => ({ text: '', number: null, date: '', optionID: null, optionIDs: [], fileURL: '', fileName: '' });

@Component({
  selector: 'app-submission-pendataan-page',
  standalone: true,
  templateUrl: './submission.pendataan.page.html',
  imports: [FormsModule, RouterLink, IconComponent, SelectComponent, PdfUploadComponent, ImageUploadComponent],
  providers: [SubmissionPendataanPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .status-banner { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: var(--radius-md); background: var(--color-bg-warm); margin-bottom: 20px; }
    .section-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 18px; margin-bottom: 16px; }
    .section-card h3 { margin-bottom: 4px; }
    .field-group { margin-top: 16px; }
    .field-label { font-weight: 600; font-size: .92rem; margin-bottom: 6px; display: block; }
    .field-help { color: var(--color-muted); font-size: .82rem; margin-top: 4px; }
    .radio-list, .check-list { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
    .actions-bar { display: flex; gap: 12px; margin-top: 24px; }
    .answer-view { padding: 10px 0; border-bottom: 1px solid var(--color-border); }
    .answer-view dt { font-weight: 600; font-size: .88rem; }
    .answer-view dd { color: var(--color-text-secondary); margin: 2px 0 0; }
  `],
})
export class SubmissionPendataanPage implements OnInit, SubmissionPendataanView {
  private presenter = inject(SubmissionPendataanPresenter);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  /** formCode ditentukan oleh shell/route yang memuat halaman ini (data:
   *  {formCode}) — cms-ldk selalu Levelisasi LDK, kader selalu Sensus Kader —
   *  BUKAN dari tier akun pemanggil. Sebelumnya dihitung dari
   *  auth.user()?.organizationTypeCode, yang salah untuk Super Admin/wildcard
   *  (organizationTypeCode kosong) sehingga cms-ldk/submissions/pendataan
   *  ikut menampilkan form Sensus Kader alih-alih Levelisasi LDK (miss-
   *  development-prompt-2.md poin 7). */
  formCode = computed(() => (this.route.snapshot.data['formCode'] as string | undefined) ?? FORM_CODE_LEVELISASI);
  isKaderSubject = computed(() => this.formCode() === FORM_CODE_SENSUS_KADER);

  version = signal<FormVersionDetail | null>(null);
  submission = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);
  ldkOptions = signal<SelectOption[]>([]);
  selectedOrgID: number | null = null;

  answers = signal<Record<number, AnswerDraft>>({});

  isEditable = computed(() => {
    const s = this.submission();
    return s !== null && EDITABLE_STATUSES.includes(s.status);
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadAll(this.formCode());
    if (this.isKaderSubject()) this.presenter.loadLdkOptions();
  }

  allFields(): FormField[] {
    return (this.version()?.sections ?? []).flatMap((s) => s.fields);
  }
  findField(fieldID: number): FormField | undefined {
    return this.allFields().find((f) => f.fieldID === fieldID);
  }

  answerAsString(field: FormField, draft: AnswerDraft): string {
    if (draft.optionID != null) return field.options.find((o) => o.optionID === draft.optionID)?.optionValue ?? '';
    if (draft.text) return draft.text;
    if (draft.number != null) return String(draft.number);
    if (draft.date) return draft.date;
    return '';
  }

  isFieldVisible(field: FormField): boolean {
    if (!field.conditionalOnFieldID || !field.conditionalRule) return true;
    const triggerField = this.findField(field.conditionalOnFieldID);
    const triggerDraft = this.answers()[field.conditionalOnFieldID];
    if (!triggerField || !triggerDraft) return false;
    const actual = this.answerAsString(triggerField, triggerDraft);
    if (!actual) return false;
    return field.conditionalRule.operator === 'notEquals' ? actual !== field.conditionalRule.value : actual === field.conditionalRule.value;
  }

  optionSelectOptions(field: FormField): SelectOption[] {
    return field.options.filter((o) => o.isActive).map((o) => ({ value: o.optionID, label: o.optionLabel }));
  }

  toggleMultiOption(field: FormField, optionID: number): void {
    const draft = this.answers()[field.fieldID];
    const set = new Set(draft.optionIDs);
    set.has(optionID) ? set.delete(optionID) : set.add(optionID);
    draft.optionIDs = [...set];
    this.answers.update((m) => ({ ...m, [field.fieldID]: draft }));
  }

  onFileChange(field: FormField, url: string): void {
    const draft = this.answers()[field.fieldID];
    draft.fileURL = url;
    draft.fileName = url ? url.split('/').pop() ?? '' : '';
    this.answers.update((m) => ({ ...m, [field.fieldID]: draft }));
  }

  private buildAnswerInputs(): unknown[] {
    const out: unknown[] = [];
    for (const field of this.allFields()) {
      if (!this.isFieldVisible(field)) continue;
      const draft = this.answers()[field.fieldID];
      if (!draft) continue;
      const input: Record<string, unknown> = { fieldID: field.fieldID };
      switch (field.fieldType) {
        case 'TEXT': case 'TEXTAREA':
          if (!draft.text) continue;
          input['valueText'] = draft.text;
          break;
        case 'NUMBER':
          if (draft.number == null) continue;
          input['valueNumber'] = draft.number;
          break;
        case 'DATE':
          if (!draft.date) continue;
          input['valueDate'] = draft.date;
          break;
        case 'SELECT': case 'RADIO':
          if (draft.optionID == null) continue;
          input['valueOptionID'] = draft.optionID;
          break;
        case 'MULTISELECT': case 'CHECKBOX':
          if (draft.optionIDs.length === 0) continue;
          input['valueOptionIDs'] = draft.optionIDs;
          break;
        case 'FILE_DOCUMENT': case 'FILE_IMAGE':
          if (!draft.fileURL) continue;
          input['valueFileURL'] = draft.fileURL;
          input['valueFileName'] = draft.fileName;
          break;
      }
      out.push(input);
    }
    return out;
  }

  start(): void {
    this.presenter.create(this.formCode(), this.isKaderSubject() ? this.selectedOrgID : null);
  }

  saveDraft(): void {
    const s = this.submission();
    if (!s) return;
    this.presenter.saveAnswers(s.submissionID, this.buildAnswerInputs(), () => this.reload());
  }

  submitForm(): void {
    const s = this.submission();
    if (!s) return;
    this.presenter.submit(s.submissionID, this.buildAnswerInputs());
  }

  async cancel(event?: Event): Promise<void> {
    const s = this.submission();
    if (!s) return;
    const ok = await this.alert.confirm('Batalkan pendataan ini? Seluruh jawaban yang tersimpan akan hilang.', {
      title: 'Batalkan Pendataan', confirmLabel: 'Ya, Batalkan', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.cancel(s.submissionID);
  }

  private buildAnswerMap(detail: SubmissionDetail | null): Record<number, AnswerDraft> {
    const map: Record<number, AnswerDraft> = {};
    for (const field of this.allFields()) map[field.fieldID] = emptyDraft();
    if (detail) {
      for (const a of detail.answers) {
        const draft = map[a.fieldID] ?? emptyDraft();
        draft.text = a.valueText ?? '';
        draft.number = a.valueNumber ?? null;
        draft.date = a.valueDate ?? '';
        draft.optionID = a.valueOptionID ?? null;
        draft.optionIDs = a.valueOptionIDs ?? [];
        draft.fileURL = a.valueFileURL ?? '';
        draft.fileName = a.valueFileName ?? '';
        map[a.fieldID] = draft;
      }
    }
    return map;
  }

  setVersion(version: FormVersionDetail): void {
    this.version.set(version);
    this.answers.set(this.buildAnswerMap(this.submission()));
  }
  setSubmission(detail: SubmissionDetail | null): void {
    this.submission.set(detail);
    if (this.version()) this.answers.set(this.buildAnswerMap(detail));
  }
  setLdkOptions(options: SelectOption[]): void { this.ldkOptions.set(options); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  reload(): void { this.loading.set(true); this.presenter.loadAll(this.formCode()); }
}
