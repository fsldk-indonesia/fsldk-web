import { Component, Input } from '@angular/core';
import { FormField, FormVersionDetail } from '../../submission-form/entities/submission-form';
import { AnswerResponse } from '../entities/submission';

/**
 * Tampilan baca-saja jawaban submission, dirender dari struktur form
 * terpublikasi — dipakai bersama oleh seluruh halaman reviewer (Verifikasi,
 * Persetujuan, Verifikasi Akhir, Persetujuan Kader, Penetapan Levelisasi,
 * Publikasi) supaya evaluasi conditional field & resolusi label pilihan
 * tidak diduplikasi di tiap halaman.
 */
@Component({
  selector: 'app-submission-answers-view',
  standalone: true,
  template: `
    @if (!version) {
      <p class="text-muted">Struktur form tidak tersedia.</p>
    } @else {
      @for (section of version.sections; track section.sectionID) {
        <div class="answers-section">
          <h4>{{ section.sectionLabel }}</h4>
          <dl>
            @for (field of section.fields; track field.fieldID) {
              @if (isVisible(field)) {
                <div class="answer-row">
                  <dt>{{ field.fieldLabel }}</dt>
                  @if (isFileField(field) && fileURL(field)) {
                    <dd><a [href]="fileURL(field)" target="_blank" rel="noopener">{{ displayValue(field) || 'Lihat berkas' }}</a></dd>
                  } @else {
                    <dd>{{ displayValue(field) || '—' }}</dd>
                  }
                </div>
              }
            }
          </dl>
        </div>
      }
    }
  `,
  styles: [`
    .answers-section { margin-bottom: 18px; }
    .answers-section:last-child { margin-bottom: 0; }
    .answers-section h4 { margin-bottom: 8px; color: var(--color-text-secondary); font-size: .85rem; text-transform: uppercase; letter-spacing: .04em; }
    .answer-row { padding: 10px 0; border-bottom: 1px solid var(--color-border); }
    .answer-row:last-child { border-bottom: none; }
    .answer-row dt { font-weight: 600; font-size: .9rem; }
    .answer-row dd { margin: 2px 0 0; color: var(--color-text-secondary); }
  `],
})
export class SubmissionAnswersViewComponent {
  @Input() version: FormVersionDetail | null = null;
  @Input() answers: AnswerResponse[] = [];

  private answerByFieldID(fieldID: number): AnswerResponse | undefined {
    return this.answers.find((a) => a.fieldID === fieldID);
  }
  private allFields(): FormField[] {
    return (this.version?.sections ?? []).flatMap((s) => s.fields);
  }
  private findField(fieldID: number): FormField | undefined {
    return this.allFields().find((f) => f.fieldID === fieldID);
  }

  private rawStringValue(field: FormField): string {
    const a = this.answerByFieldID(field.fieldID);
    if (!a) return '';
    if (a.valueOptionID != null) return field.options.find((o) => o.optionID === a.valueOptionID)?.optionValue ?? '';
    if (a.valueText) return a.valueText;
    if (a.valueNumber != null) return String(a.valueNumber);
    if (a.valueDate) return a.valueDate;
    return '';
  }

  isVisible(field: FormField): boolean {
    if (!field.conditionalOnFieldID || !field.conditionalRule) return true;
    const triggerField = this.findField(field.conditionalOnFieldID);
    if (!triggerField) return false;
    const actual = this.rawStringValue(triggerField);
    if (!actual) return false;
    return field.conditionalRule.operator === 'notEquals' ? actual !== field.conditionalRule.value : actual === field.conditionalRule.value;
  }

  isFileField(field: FormField): boolean {
    return field.fieldType === 'FILE_DOCUMENT' || field.fieldType === 'FILE_IMAGE';
  }

  fileURL(field: FormField): string {
    return this.answerByFieldID(field.fieldID)?.valueFileURL ?? '';
  }

  displayValue(field: FormField): string {
    const a = this.answerByFieldID(field.fieldID);
    if (!a) return '';
    switch (field.fieldType) {
      case 'SELECT': case 'RADIO':
        return field.options.find((o) => o.optionID === a.valueOptionID)?.optionLabel ?? '';
      case 'MULTISELECT': case 'CHECKBOX':
        return (a.valueOptionIDs ?? [])
          .map((id) => field.options.find((o) => o.optionID === id)?.optionLabel)
          .filter((v): v is string => !!v)
          .join(', ');
      case 'FILE_DOCUMENT': case 'FILE_IMAGE':
        return a.valueFileName || '';
      case 'NUMBER':
        return a.valueNumber != null ? String(a.valueNumber) : '';
      case 'DATE':
        return a.valueDate ?? '';
      default:
        return a.valueText ?? '';
    }
  }
}
