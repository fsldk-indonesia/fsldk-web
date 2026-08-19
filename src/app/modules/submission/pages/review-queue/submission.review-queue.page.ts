import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { SubmissionAnswersViewComponent } from '../../components/submission-answers-view.component';
import { SubmissionScoringPanelComponent } from '../../components/submission-scoring-panel.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionResponse, SubmissionDetail, ReviewDecision, SUBMISSION_STATUS_LABELS } from '../../entities/submission';
import { SubmissionReviewQueuePresenter } from './submission.review-queue.presenter';
import { SubmissionReviewQueueView } from './submission.review-queue.view';

@Component({
  selector: 'app-submission-review-queue-page',
  standalone: true,
  templateUrl: './submission.review-queue.page.html',
  imports: [FormsModule, SelectComponent, SubmissionAnswersViewComponent, SubmissionScoringPanelComponent],
  providers: [SubmissionReviewQueuePresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; cursor: pointer; text-align: left; }
    .queue-row:hover { border-color: var(--color-primary); }
    .queue-row.active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .queue-row strong { font-size: .92rem; }
    .queue-row .chip { align-self: flex-start; }
    .detail-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 20px; }
    .decision-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 14px; }
    .checklist { display: flex; flex-direction: column; gap: 8px; }
    .actions-bar { display: flex; gap: 12px; }
  `],
})
export class SubmissionReviewQueuePage implements OnInit, SubmissionReviewQueueView {
  private presenter = inject(SubmissionReviewQueuePresenter);
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] as string;
  reviewTier = this.route.snapshot.data['reviewTier'] as 'PUSKOMDA' | 'PUSKOMNAS';
  statuses = this.route.snapshot.data['statuses'] as string[];
  canApprove = !!(this.route.snapshot.data['canApprove'] as boolean | undefined);

  queue = signal<SubmissionResponse[]>([]);
  orgNames = signal<Record<number, string>>({});
  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);

  decision: ReviewDecision = 'REVISION_REQUESTED';
  note = '';
  checklist: Record<string, boolean> = {};

  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  decisionOptions: SelectOption[] = this.canApprove
    ? [{ value: 'APPROVED', label: 'Setujui' }, { value: 'REVISION_REQUESTED', label: 'Minta Revisi' }]
    : [{ value: 'REVISION_REQUESTED', label: 'Minta Revisi' }];

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadQueue(this.statuses);
  }

  orgName(id: number): string { return this.orgNames()[id] ?? `Organisasi #${id}`; }
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  select(item: SubmissionResponse): void {
    this.decision = this.decisionOptions[0].value as ReviewDecision;
    this.note = '';
    this.checklist = {};
    for (const s of this.version()?.sections ?? []) this.checklist[s.sectionCode] = false;
    this.presenter.openDetail(item.submissionID);
  }

  toggleChecklist(sectionCode: string): void {
    this.checklist[sectionCode] = !this.checklist[sectionCode];
  }

  submitDecision(): void {
    const d = this.detail();
    if (!d) return;
    this.presenter.submitDecision(d.submissionID, {
      decision: this.decision, note: this.note, checklist: this.checklist, version: d.version,
    }, this.statuses);
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
