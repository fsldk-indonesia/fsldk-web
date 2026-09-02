import { FinanceAuditLogItem } from '../../entities/audit-log';

export interface KantongAmalAdminAuditLogView {
  setLoading(loading: boolean): void;
  setLogs(logs: FinanceAuditLogItem[], count: number): void;
}
