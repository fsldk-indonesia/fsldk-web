import { FinanceFormatType } from '../../entities/finance-format-type';
import { FinanceFormatFormValue } from './financeformat.form.presenter';

export interface FinanceFormatFormView {
  setTypes(types: FinanceFormatType[]): void;
  setForm(form: FinanceFormatFormValue): void;
  setSaving(saving: boolean): void;
  navigateToIndex(): void;
}
