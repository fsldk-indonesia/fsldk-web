import { UserRow } from '../../entities/user';
import { Role } from '../../../role/entities/role';

export interface UserIndexView {
  setUsers(users: UserRow[], count: number): void;
  setRoles(roles: Role[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
