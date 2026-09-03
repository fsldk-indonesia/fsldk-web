import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormSubmissionRow } from '../../entities/dynamic-form-submission';

export interface DynamicFormResponsesView {
  setForm(form: DynamicForm): void;
  setSubmissions(rows: DynamicFormSubmissionRow[], count: number): void;
  onMutated(): void;
}
