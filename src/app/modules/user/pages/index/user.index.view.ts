import { UserRow } from '../../entities/user';
import { Role } from '../../../role/entities/role';
import { SelectOption } from '../../../../shared/select.component';

export interface UserIndexView {
  setUsers(users: UserRow[], count: number): void;
  setRoles(roles: Role[]): void;
  setOrganizationOptions(options: SelectOption[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
