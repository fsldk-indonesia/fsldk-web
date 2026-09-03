import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { DynamicFormField } from '../../entities/dynamic-form-field';
import { DynamicFormSubmissionDetail } from '../../entities/dynamic-form-submission';
import { isDisplayField } from '../../dynamicform.constants';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormResponseEditPresenter } from './dynamicform.response-edit.presenter';
import { DynamicFormResponseEditView } from './dynamicform.response-edit.view';

@Component({
  selector: 'app-dynamicform-response-edit-page',
  standalone: true,
  templateUrl: './dynamicform.response-edit.page.html',
  imports: [FormsModule, RouterLink, IconComponent],
  providers: [DynamicFormResponseEditPresenter],
  styles: [`
    .form-card { max-width: 720px; margin: 0 auto; }
    .field { margin-bottom: 16px; }
    label { display: block; font-weight: 600; font-size: .88rem; margin-bottom: 4px; }
    .muted { color: var(--color-text-secondary); font-size: .8rem; }
    .actions { display: flex; gap: 10px; margin-top: 8px; }
  `],
})
export class DynamicFormResponseEditPage implements OnInit, DynamicFormResponseEditView {
  private presenter = inject(DynamicFormResponseEditPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly path = dynamicFormPath;
  formId = Number(this.route.snapshot.paramMap.get('id'));
  subId = Number(this.route.snapshot.paramMap.get('subId'));
  detail = signal<DynamicFormSubmissionDetail | null>(null);
  saving = signal(false);

  /** Working values keyed "field_<id>" — string, or string[] for checkbox. */
  values: Record<string, string | string[]> = {};
  fileReplacements: Record<number, File> = {};

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.formId, this.subId);
  }

  editableFields(): DynamicFormField[] {
    return (this.detail()?.fields ?? []).filter((f) => !isDisplayField(f.fieldType));
  }

  fileFor(fieldId: number) {
    return (this.detail()?.files ?? []).find((f) => f.fieldID === fieldId);
  }

  isChecked(key: string, value: string): boolean {
    const v = this.values[key];
    return Array.isArray(v) && v.includes(value);
  }
  toggleCheckbox(key: string, value: string, checked: boolean): void {
    const cur = Array.isArray(this.values[key]) ? [...(this.values[key] as string[])] : [];
    const i = cur.indexOf(value);
    if (checked && i < 0) cur.push(value);
    if (!checked && i >= 0) cur.splice(i, 1);
    this.values[key] = cur;
  }

  onFilePicked(fieldId: number, ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (file) this.fileReplacements[fieldId] = file;
  }

  save(): void {
    const fd = new FormData();
    for (const f of this.editableFields()) {
      const key = `field_${f.fieldID}`;
      if (f.fieldType === 'file') continue;
      const v = this.values[key];
      if (Array.isArray(v)) {
        for (const item of v) fd.append(key, item);
        if (v.length === 0) fd.append(key, '');
      } else {
        fd.append(key, v ?? '');
      }
    }
    for (const [fieldId, file] of Object.entries(this.fileReplacements)) {
      fd.append(`field_${fieldId}`, file);
    }
    this.presenter.save(this.formId, this.subId, fd);
  }

  setDetail(detail: DynamicFormSubmissionDetail): void {
    this.detail.set(detail);
    const next: Record<string, string | string[]> = {};
    for (const f of detail.fields) {
      const key = `field_${f.fieldID}`;
      const raw = detail.answers[key] ?? '';
      if (f.fieldType === 'checkbox') {
        try { next[key] = JSON.parse(raw); } catch { next[key] = raw ? [raw] : []; }
      } else {
        next[key] = raw;
      }
    }
    this.values = next;
  }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateBack(): void { this.router.navigate([this.path.responses(this.formId)]); }
}
