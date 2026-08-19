import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ConsolidatedScoreResponse } from '../entities/submission';

/**
 * Panel Skor Konsolidasi (enhancement Flexible Scoring) — TERPISAH dari
 * `SubmissionAnswersViewComponent` (read-only, dipakai bersama LDK/Puskomda/
 * Puskomnas) supaya nol risiko ke alur review existing. Dirender SEBAGAI
 * TAMBAHAN di halaman Verifikasi Akhir & Penetapan Levelisasi (Puskomnas
 * saja — backend juga sudah tidak pernah mengirim `consolidatedScore` ke
 * caller non-Puskomnas, jadi komponen ini pun tidak pernah dipasang di
 * halaman LDK/Puskomda).
 *
 * Field ber-`source: 'AUTOMATIC'` (Single Choice) ditampilkan read-only —
 * skornya sudah dihitung backend dari jawaban LDK. Field ber-`source:
 * 'MANUAL'` menampilkan input angka (hanya saat `editable`) untuk Puskomnas
 * memberi skor — murni informatif, tidak memengaruhi keputusan Review/
 * EstablishLevel yang sudah ada.
 */
@Component({
  selector: 'app-submission-scoring-panel',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    @if (consolidatedScore; as cs) {
      <div class="scoring-panel">
        <div class="scoring-head">
          <h4>Skor Konsolidasi</h4>
          <span class="final-score" [class.incomplete]="!cs.isComplete">{{ cs.finalScore }}%</span>
        </div>
        @if (!cs.isComplete) {
          <p class="text-muted incomplete-note">Skor belum lengkap — masih ada field yang belum dijawab/belum diberi skor manual.</p>
        }
        <table class="scoring-table">
          <thead>
            <tr><th>Field</th><th>Skor</th><th>Maks</th><th>Normalisasi</th><th>Bobot</th><th>Kontribusi</th><th>Sumber</th></tr>
          </thead>
          <tbody>
            @for (fs of cs.fields; track fs.fieldID) {
              <tr>
                <td>{{ fs.fieldLabel }}</td>
                <td>
                  @if (fs.source === 'MANUAL' && editable) {
                    <input type="number" class="form-control score-input" [ngModel]="draft[fs.fieldID]" (ngModelChange)="draft[fs.fieldID] = $event" [min]="0" [max]="fs.maxScore">
                  } @else {
                    {{ fs.hasScore ? fs.rawScore : '—' }}
                  }
                </td>
                <td>{{ fs.maxScore }}</td>
                <td>{{ fs.hasScore ? (fs.normalized | number:'1.0-1') + '%' : '—' }}</td>
                <td>{{ fs.weight }}%</td>
                <td>{{ fs.hasScore ? (fs.weightedScore | number:'1.0-1') + '%' : '—' }}</td>
                <td><span class="chip" [class.chip-green]="fs.source === 'AUTOMATIC'">{{ fs.source === 'AUTOMATIC' ? 'Otomatis' : 'Manual' }}</span></td>
              </tr>
            }
          </tbody>
        </table>
        @if (editable && hasManualFields(cs)) {
          <button class="btn btn-primary btn-sm" style="margin-top:12px" (click)="submitScores(cs)" [disabled]="busy">Simpan Skor</button>
        }
      </div>
    }
  `,
  styles: [`
    .scoring-panel { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 18px; margin-top: 16px; }
    .scoring-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .scoring-head h4 { margin: 0; }
    .final-score { font-size: 1.5rem; font-weight: 700; color: var(--color-primary-dark); }
    .final-score.incomplete { color: var(--color-muted); }
    .incomplete-note { margin-bottom: 10px; }
    .scoring-table { width: 100%; border-collapse: collapse; font-size: .86rem; margin-top: 10px; }
    .scoring-table th, .scoring-table td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--color-border); }
    .scoring-table th { color: var(--color-text-secondary); font-weight: 600; font-size: .78rem; text-transform: uppercase; letter-spacing: .03em; }
    .score-input { width: 80px; padding: 4px 8px; }
  `],
})
export class SubmissionScoringPanelComponent implements OnChanges {
  @Input() consolidatedScore: ConsolidatedScoreResponse | null = null;
  @Input() editable = false;
  @Input() busy = false;
  @Output() save = new EventEmitter<{ fieldID: number; rawScore: number }[]>();

  /** Draft lokal input skor manual, keyed by fieldID — direset tiap
   *  consolidatedScore berubah (mis. setelah reload) supaya tidak menampilkan
   *  input basi dari submission/field lain. */
  draft: Record<number, number | null> = {};

  ngOnChanges(): void {
    const next: Record<number, number | null> = {};
    for (const fs of this.consolidatedScore?.fields ?? []) {
      if (fs.source === 'MANUAL') next[fs.fieldID] = fs.hasScore ? fs.rawScore ?? null : null;
    }
    this.draft = next;
  }

  hasManualFields(cs: ConsolidatedScoreResponse): boolean {
    return cs.fields.some((f) => f.source === 'MANUAL');
  }

  submitScores(cs: ConsolidatedScoreResponse): void {
    const scores = cs.fields
      .filter((f) => f.source === 'MANUAL' && this.draft[f.fieldID] != null)
      .map((f) => ({ fieldID: f.fieldID, rawScore: this.draft[f.fieldID] as number }));
    if (scores.length === 0) return;
    this.save.emit(scores);
  }
}
