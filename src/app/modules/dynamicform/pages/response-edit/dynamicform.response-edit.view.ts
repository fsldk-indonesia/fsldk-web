import { DynamicFormSubmissionDetail } from '../../entities/dynamic-form-submission';

export interface DynamicFormResponseEditView {
  setDetail(detail: DynamicFormSubmissionDetail): void;
  setSaving(saving: boolean): void;
  navigateBack(): void;
}
