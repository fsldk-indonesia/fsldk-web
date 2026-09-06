import { DynamicForm } from '../../entities/dynamic-form';

export interface DynamicFormIndexView {
  setForms(forms: DynamicForm[], count: number): void;
  onActionSettled(id: number): void;
  onMutated(): void;
}
