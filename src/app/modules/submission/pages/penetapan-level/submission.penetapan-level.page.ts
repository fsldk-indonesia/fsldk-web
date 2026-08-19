import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { SubmissionAnswersViewComponent } from '../../components/submission-answers-view.component';
import { SubmissionScoringPanelComponent } from '../../components/submission-scoring-panel.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionResponse, SubmissionDetail, LEVEL_OPTIONS, SUBMISSION_STATUS_LABELS } from '../../entities/submission';
import { SubmissionPenetapanLevelPresenter } from './submission.penetapan-level.presenter';
import { SubmissionPenetapanLevelView } from './submission.penetapan-level.view';

@Component({
  selector: 'app-submission-penetapan-level-page',
  standalone: true,
  templateUrl: './submission.penetapan-level.page.html',
  imports: [FormsModule, SelectComponent, SubmissionAnswersViewComponent, SubmissionScoringPanelComponent],
  providers: [SubmissionPenetapanLevelPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; cursor: pointer; text-align: left; }
    .queue-row:hover { border-color: var(--color-primary); }
    .queue-row.active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .detail-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 20px; }
    .decision-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 14px; }
  `],
})
export class SubmissionPenetapanLevelPage implements OnInit, SubmissionPenetapanLevelView {
  private presenter = inject(SubmissionPenetapanLevelPresenter);

  queue = signal<SubmissionResponse[]>([]);
  orgNames = signal<Record<number, string>>({});
  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);

  levelCode: string | null = null;
  justificationNote = '';
  readonly levelOptions: SelectOption[] = LEVEL_OPTIONS;
  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadQueue();
  }

  orgName(id: number): string { return this.orgNames()[id] ?? `Organisasi #${id}`; }
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  select(item: SubmissionResponse): void {
    this.levelCode = null;
    this.justificationNote = '';
    this.presenter.openDetail(item.submissionID);
  }

  submit(): void {
    const d = this.detail();
    if (!d || !this.levelCode) return;
    this.presenter.establishLevel(d.submissionID, {
      levelCode: this.levelCode, justificationNote: this.justificationNote, version: d.version,
    });
  }

  saveScores(scores: { fieldID: number; rawScore: number }[]): void {
    const d = this.detail();
    if (!d) return;
    this.presenter.saveFieldScores(d.submissionID, scores);
  }

  setQueue(items: SubmissionResponse[]): void { this.queue.set(items); }
  setOrgNames(names: Record<number, string>): void { this.orgNames.set(names); }
  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setDetail(detail: SubmissionDetail): void { this.detail.set(detail); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  onDecisionSuccess(): void { this.detail.set(null); }
}
