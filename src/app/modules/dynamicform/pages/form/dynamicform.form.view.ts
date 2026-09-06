import { GSheetStatus } from '../../entities/dynamic-form';
import { DynamicFormFormValue } from './dynamicform.form.presenter';

export interface DynamicFormFormView {
  setForm(form: DynamicFormFormValue): void;
  setSaving(saving: boolean): void;
  setGsheetStatus(status: GSheetStatus): void;
  setGsheetAvailable(available: boolean): void;
  navigateToIndex(): void;
  navigateToBuilder(id: number): void;
}
