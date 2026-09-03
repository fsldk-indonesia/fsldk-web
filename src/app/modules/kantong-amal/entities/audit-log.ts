export interface FinanceAuditLogItem {
  logID: number;
  actorUserID: number;
  actorName?: string;
  action: string;
  entity: string;
  entityID: number;
  beforeJSON?: string;
  afterJSON?: string;
  metadata?: string;
  createdDate: string;
}
