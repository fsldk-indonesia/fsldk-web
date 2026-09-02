import { ScheduleFormValue } from './schedule.form.presenter';

export interface ScheduleFormView {
  setForm(form: ScheduleFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
