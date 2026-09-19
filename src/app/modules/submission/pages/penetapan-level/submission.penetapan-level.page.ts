import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { IconComponent } from '../../../../shared/icon.component';
import { SubmissionAnswersViewComponent } from '../../components/submission-answers-view.component';
import { SubmissionScoringPanelComponent } from '../../components/submission-scoring-panel.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionResponse, SubmissionDetail, LEVEL_OPTIONS, SUBMISSION_STATUS_LABELS, statusTone } from '../../entities/submission';
import { SubmissionPenetapanLevelPresenter } from './submission.penetapan-level.presenter';
import { SubmissionPenetapanLevelView } from './submission.penetapan-level.view';

@Component({
  selector: 'app-submission-penetapan-level-page',
  standalone: true,
  templateUrl: './submission.penetapan-level.page.html',
  imports: [FormsModule, SelectComponent, IconComponent, SubmissionAnswersViewComponent, SubmissionScoringPanelComponent],
  providers: [SubmissionPenetapanLevelPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    /* min-width:0 di grid item WAJIB — default grid item min-width:auto
       bikin ukurannya tidak pernah bisa menciut di bawah min-content
       kontennya sendiri. Kalau ADA elemen lebar di dalam kolom kanan
       (mis. tabel Skor Konsolidasi sebelum dibungkus .table-wrap), grid
       TRACK 1fr ini ikut dipaksa selebar itu — dan karena kedua kolom
       (Antrian & Detail) berbagi TRACK yang sama di layout 1-kolom mobile,
       Antrian pun ikut kebawa lebar padahal isinya sendiri tidak butuh
       (bug "kartu kepotong" yang dilaporkan). */
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
    .layout > div { min-width: 0; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; cursor: pointer; text-align: left; }
    .queue-row:hover { border-color: var(--color-primary); }
    .queue-row.active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .decision-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 14px; }
    /* transform:none (BUKAN translateY(0)) di state diam — keduanya sama
       persis secara visual (offset 0px), tapi translateY(0) TETAP dianggap
       "punya transform" oleh spec CSS (bukan literal none), jadi tetap
       menjadikan elemen ini containing block baru untuk descendant
       position:fixed — persis kuirk yang sama yang sudah didokumentasikan &
       diperbaiki untuk .modal-pop di styles.scss. <app-select> "Level" di
       dalam kartu ini pakai position:fixed utk popup-nya (select.component.ts
       reposition() menghitung koordinat viewport-absolute lewat
       getBoundingClientRect()) — begitu kartu ini closingBlock, top/left
       yang seharusnya absolut-ke-viewport malah diresolusi relatif ke kartu
       ini, popup jadi "melenceng"/kepotong jauh dari trigger-nya (bug yang
       dilaporkan). */
    .detail-card-fade { opacity: 0; transform: translateY(6px); transition: opacity .25s ease, transform .25s ease; }
    .detail-card-fade.is-visible { opacity: 1; transform: none; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
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
  detailTransitioning = signal(false);

  levelCode: string | null = null;
  justificationNote = '';
  readonly levelOptions: SelectOption[] = LEVEL_OPTIONS;
  readonly statusLabels = SUBMISSION_STATUS_LABELS;
  readonly statusTone = statusTone;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadQueue();
  }

  orgName(id: number): string { return this.orgNames()[id] ?? `Organisasi #${id}`; }
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  select(item: SubmissionResponse): void {
    this.levelCode = null;
    this.justificationNote = '';
    this.detailTransitioning.set(true);
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
  setDetail(detail: SubmissionDetail): void {
    this.detail.set(detail);
    requestAnimationFrame(() => this.detailTransitioning.set(false));
  }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  onDecisionSuccess(): void { this.detail.set(null); }
}
