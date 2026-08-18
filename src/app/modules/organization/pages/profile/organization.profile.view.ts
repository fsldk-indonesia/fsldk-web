import { Organization } from '../../entities/organization';

export interface OrganizationProfileView {
  setOrganization(org: Organization): void;
  setLoading(loading: boolean): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
}
