import { EventFormValue } from './event.form.presenter';

export interface EventFormView {
  setForm(form: EventFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
