import { StructureFormValue } from './structure.form.presenter';

export interface StructureFormView {
  setForm(form: StructureFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
