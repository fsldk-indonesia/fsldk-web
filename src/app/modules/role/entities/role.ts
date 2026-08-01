export interface Role {
  roleID: number;
  roleName: string;
  roleDescription: string;
  isSystemRole: boolean;
  isActive: boolean;
  userCount: number;
  permissions: string[];
  permissionIDs: number[];
}
