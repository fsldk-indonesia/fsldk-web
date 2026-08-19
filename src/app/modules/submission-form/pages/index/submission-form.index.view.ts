import { SubmissionForm } from '../../entities/submission-form';

export interface SubmissionFormIndexView {
  setForms(forms: SubmissionForm[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
}
