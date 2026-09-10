import { Role } from '../../../role/entities/role';
import { SelectOption } from '../../../../shared/select.component';

export interface UserIndexView {
  setRoles(roles: Role[]): void;
  setOrganizationOptions(options: SelectOption[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
