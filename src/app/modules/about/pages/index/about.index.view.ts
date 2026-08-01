import { OrgMember } from '../../../content/entities/org-member';

export interface AboutIndexView {
  setContent(content: Record<string, string>): void;
  setOrgMembers(members: OrgMember[]): void;
}
