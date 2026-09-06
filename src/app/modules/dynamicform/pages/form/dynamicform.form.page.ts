import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { GSheetStatus } from '../../entities/dynamic-form';
import { dynamicFormPath } from '../../dynamicform.path';
import {
  DynamicFormFormPresenter, DynamicFormFormValue, emptyDynamicFormForm,
} from './dynamicform.form.presenter';
import { DynamicFormFormView } from './dynamicform.form.view';

@Component({
  selector: 'app-dynamicform-form-page',
  standalone: true,
  templateUrl: './dynamicform.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent],
  providers: [DynamicFormFormPresenter],
  styles: [`
    .page-head { max-width: 960px; margin: 0 auto 20px; }
    .back { display: flex; width: fit-content; align-items: center; gap: 6px; margin-bottom: 10px; color: var(--color-text-secondary); font-size: .9rem; }
    .page-head h1 { margin: 0; display: inline-block; padding-bottom: 6px; border-bottom: 3px solid var(--color-primary); }
    .form-card { max-width: 960px; margin: 0 auto; padding: 28px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .col { min-width: 0; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: .78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .07em; color: var(--color-muted);
      margin: 26px 0 14px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }
    .section-title:first-child { margin-top: 0; }
    .section-title app-icon { color: var(--color-primary); }
    .req { color: var(--color-danger); }
    .muted-note { color: var(--color-muted); font-weight: 400; }
    .info-box { display: flex; gap: 10px; align-items: flex-start; background: var(--color-primary-soft);
      color: var(--color-primary-dark); border-radius: var(--radius-xs); padding: 12px 14px;
      font-size: .84rem; line-height: 1.5; margin-bottom: 14px; }
    .info-box app-icon { flex-shrink: 0; margin-top: 1px; }
    .advanced { margin-top: 4px; }
    .gsheet-status { background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: var(--radius-xs); padding: 14px; margin-top: 4px; font-size: .88rem; }
    .gsheet-status p { margin: 0 0 6px; }
    .gsheet-status p:last-child { margin-bottom: 0; }
    .gsheet-error { color: var(--color-warning); }
    .form-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--color-border); }
    @media (max-width: 900px) {
      .cols { grid-template-columns: 1fr; gap: 4px; }
    }
    @media (max-width: 560px) {
      .form-footer { flex-direction: column-reverse; }
      .form-footer .btn { width: 100%; justify-content: center; }
    }
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
  gsheetAvailable = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.editId = +id; this.presenter.loadForEdit(this.editId); }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  connect(): void { if (this.editId) this.presenter.gsheetConnect(this.editId); }
  resync(): void { if (this.editId) this.presenter.gsheetResync(this.editId); }
  disconnect(): void { if (this.editId) this.presenter.gsheetDisconnect(this.editId); }

  setForm(form: DynamicFormFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  setGsheetStatus(status: GSheetStatus): void { this.gsheet.set(status); this.form.gsheetEnabled = status.enabled; }
  setGsheetAvailable(available: boolean): void { this.gsheetAvailable.set(available); }
  navigateToIndex(): void { this.router.navigate([this.path.index]); }
  navigateToBuilder(id: number): void { this.router.navigate([this.path.builder(id)]); }
}
