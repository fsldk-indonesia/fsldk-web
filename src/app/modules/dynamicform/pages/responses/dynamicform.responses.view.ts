import { DynamicForm } from '../../entities/dynamic-form';

export interface DynamicFormResponsesView {
  setForm(form: DynamicForm): void;
  onMutated(): void;
}
