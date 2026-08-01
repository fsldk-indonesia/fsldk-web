import { Role } from '../../entities/role';
import { Permission } from '../../../permission/entities/permission';

export interface RoleIndexView {
  setRoles(roles: Role[]): void;
  setPermissions(permissions: Permission[]): void;
  setSaving(saving: boolean): void;
  onSavePermissionsSuccess(): void;
}
