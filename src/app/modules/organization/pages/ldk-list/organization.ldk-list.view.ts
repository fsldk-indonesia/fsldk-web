import { Organization } from '../../entities/organization';
import { SelectOption } from '../../../../shared/select.component';

export interface OrganizationLdkListView {
  setOrganizations(orgs: Organization[], count: number): void;
  setPuskomdaOptions(options: SelectOption[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onActionSettled(id: number): void;
}
