import { Organization } from '../../entities/organization';

export interface OrganizationProfileView {
  setOrganization(org: Organization): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
}
