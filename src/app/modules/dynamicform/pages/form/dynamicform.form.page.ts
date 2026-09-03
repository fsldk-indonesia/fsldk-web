import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { GSheetStatus } from '../../entities/dynamic-form';
import { dynamicFormPath } from '../../dynamicform.path';
import {
  CollaboratorRow, DynamicFormFormPresenter, DynamicFormFormValue, emptyDynamicFormForm,
} from './dynamicform.form.presenter';
import { DynamicFormFormView } from './dynamicform.form.view';

@Component({
  selector: 'app-dynamicform-form-page',
  standalone: true,
  templateUrl: './dynamicform.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent],
  providers: [DynamicFormFormPresenter],
  styles: [`
    .page-head { max-width: 780px; margin: 0 auto 20px; }
    .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 780px; margin: 0 auto; }
    fieldset { border: 1px solid var(--color-border); border-radius: var(--radius-md, 10px); padding: 18px; margin-bottom: 18px; }
    legend { font-weight: 600; padding: 0 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: 4px; }
    .check { display: flex; align-items: center; gap: 8px; font-weight: 500; margin: 8px 0; }
    .check input { width: auto; }
    .muted { color: var(--color-text-secondary); font-size: .8rem; }
    .collab-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }
    .gsheet-status { background: var(--color-surface-2, #f6faf7); border-radius: 8px; padding: 12px; margin-top: 10px; font-size: .85rem; }
    .gsheet-error { color: #92600a; }
    .actions { display: flex; gap: 10px; margin-top: 8px; }
  `],
})
export class DynamicFormFormPage implements OnInit, DynamicFormFormView {
  private presenter = inject(DynamicFormFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly path = dynamicFormPath;
  editId: number | null = null;
  saving = signal(false);
  form: DynamicFormFormValue = structuredClone(emptyDynamicFormForm);
  gsheet = signal<GSheetStatus | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.editId = +id; this.presenter.loadForEdit(this.editId); }
  }

  addCollaborator(): void {
    this.form.collaborators = [...this.form.collaborators, { userID: 0, role: 'editor' }];
  }
  removeCollaborator(row: CollaboratorRow): void {
    this.form.collaborators = this.form.collaborators.filter((c) => c !== row);
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  connect(): void { if (this.editId) this.presenter.gsheetConnect(this.editId); }
  resync(): void { if (this.editId) this.presenter.gsheetResync(this.editId); }
  disconnect(): void { if (this.editId) this.presenter.gsheetDisconnect(this.editId); }

  setForm(form: DynamicFormFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  setGsheetStatus(status: GSheetStatus): void { this.gsheet.set(status); this.form.gsheetEnabled = status.enabled; }
  navigateToIndex(): void { this.router.navigate([this.path.index]); }
  navigateToBuilder(id: number): void { this.router.navigate([this.path.builder(id)]); }
}
