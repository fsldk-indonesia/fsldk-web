export interface OrgMember {
  structureID: number;
  memberName: string;
  position: string;
  photoURL: string | null;
  level: string | null;
  sortOrder: number | null;
  isActive: boolean;
}
