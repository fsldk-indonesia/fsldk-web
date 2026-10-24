import { Role } from '../../../role/entities/role';
import { OrgPickerOption } from '../../../../shared/org-picker.component';

export interface UserIndexView {
  setRoles(roles: Role[]): void;
  setOrganizationOptions(options: OrgPickerOption[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
