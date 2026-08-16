import { Organization } from '../../entities/organization';

export interface OrganizationPuskomdaListView {
  setOrganizations(orgs: Organization[], count: number): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onActionSettled(id: number): void;
}
