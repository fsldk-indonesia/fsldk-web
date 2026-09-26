import { SelectOption } from '../../../../shared/select.component';

export interface OrganizationLdkListView {
  setPuskomdaOptions(options: SelectOption[]): void;
  setProvinceOptions(options: SelectOption[]): void;
  setRegencyOptions(options: SelectOption[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onActionSettled(id: number): void;
}
