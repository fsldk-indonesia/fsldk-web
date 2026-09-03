import { ReconciliationSnapshot } from '../../entities/report';

export interface KantongAmalAdminReconciliationView {
  setLoading(loading: boolean): void;
  setRunning(running: boolean): void;
  setSnapshots(snapshots: ReconciliationSnapshot[], count: number): void;
  onRunSuccess(): void;
}
