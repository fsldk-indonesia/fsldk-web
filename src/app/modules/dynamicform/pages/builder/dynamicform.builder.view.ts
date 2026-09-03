import { DynamicForm } from '../../entities/dynamic-form';

export interface DynamicFormBuilderView {
  setForm(form: DynamicForm): void;
  setBusy(busy: boolean): void;
  reload(): void;
}
