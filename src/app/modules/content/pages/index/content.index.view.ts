import { Content } from '../../entities/content';
import { OrgMember } from '../../entities/org-member';

export interface ContentIndexView {
  setContents(contents: Content[]): void;
  setMembers(members: OrgMember[]): void;
  setSaving(saving: boolean): void;
  onSaveContentSuccess(): void;
  onSaveOrgSuccess(): void;
  onRemoveOrgSuccess(): void;
}
