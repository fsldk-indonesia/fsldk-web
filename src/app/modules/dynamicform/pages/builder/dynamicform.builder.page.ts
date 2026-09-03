import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UploadService } from '../../../../core/services/upload.service';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFieldType, DynamicFormField } from '../../entities/dynamic-form-field';
import {
  FIELD_TYPES, FIELD_TYPE_GROUPS, OPTION_FIELD_TYPES, fieldTypeLabel, isDisplayField,
} from '../../dynamicform.constants';
import { statusMeta } from '../../dynamicform.constants';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormBuilderPresenter } from './dynamicform.builder.presenter';
import { DynamicFormBuilderView } from './dynamicform.builder.view';

interface FieldFormValue {
  fieldType: DynamicFieldType;
  label: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  options: { label: string; value: string }[];
  vMin: number | null;
  vMax: number | null;
  vPattern: string;
  vAcceptedTypes: string;
  vMaxSizeKB: number | null;
  cfgMinValue: number | null;
  cfgMaxValue: number | null;
  cfgMinLabel: string;
  cfgMaxLabel: string;
  cfgMaxRating: number | null;
  condFieldID: number | null;
  condOperator: string;
  condValue: string;
  condAction: 'show' | 'hide';
  imageURL: string;
}

const emptyFieldForm = (type: DynamicFieldType = 'short_text'): FieldFormValue => ({
  fieldType: type, label: '', placeholder: '', helpText: '', isRequired: false,
  options: type === 'dropdown' || type === 'radio' || type === 'checkbox'
    ? [{ label: 'Opsi 1', value: 'Opsi 1' }, { label: 'Opsi 2', value: 'Opsi 2' }] : [],
  vMin: null, vMax: null, vPattern: '', vAcceptedTypes: '', vMaxSizeKB: null,
  cfgMinValue: type === 'linear_scale' ? 1 : null, cfgMaxValue: type === 'linear_scale' ? 5 : null,
  cfgMinLabel: '', cfgMaxLabel: '', cfgMaxRating: type === 'rating' ? 5 : null,
  condFieldID: null, condOperator: 'eq', condValue: '', condAction: 'show', imageURL: '',
});

@Component({
  selector: 'app-dynamicform-builder-page',
  standalone: true,
  templateUrl: './dynamicform.builder.page.html',
  imports: [FormsModule, RouterLink, IconComponent, ModalBackdropDirective],
  providers: [DynamicFormBuilderPresenter],
  styles: [`
    .builder { display: grid; grid-template-columns: 240px 1fr; gap: 20px; align-items: start; }
    .palette { border: 1px solid var(--color-border); border-radius: 10px; padding: 14px; position: sticky; top: 16px; }
    .palette h4 { margin: 12px 0 6px; font-size: .75rem; text-transform: uppercase; color: var(--color-text-secondary); }
    .palette button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 7px 8px; border: 0; background: transparent; border-radius: 6px; cursor: pointer; font-size: .85rem; }
    .palette button:hover { background: var(--color-surface-2, #f2f5f3); }
    .field-card { border: 1px solid var(--color-border); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .field-meta { display: flex; flex-direction: column; gap: 3px; }
    .field-meta .type { font-size: .75rem; color: var(--color-text-secondary); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: .68rem; font-weight: 600; margin-right: 4px; }
    .badge-req { background: #fdecec; color: #b42318; } .badge-sys { background: #e8eefc; color: #1d4ed8; }
    .card-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .card-actions button { border: 0; background: transparent; cursor: pointer; color: var(--color-text-secondary); }
    .header-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .header-bar .status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .72rem; font-weight: 600; }
    .badge-success { background: #e1f5e9; color: #00712e; } .badge-warn { background: #fff3d6; color: #92600a; } .badge-muted { background: #eef0ee; color: #667; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: 14px; padding: 26px; width: 100%; max-width: 560px; max-height: 88vh; display: flex; flex-direction: column; }
    .modal-body { overflow-y: auto; flex: 1; padding-right: 6px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 16px; }
    label { display: block; font-size: .82rem; font-weight: 600; margin: 10px 0 4px; }
    .opt-row { display: flex; gap: 6px; margin-bottom: 5px; }
    .check { display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .muted { color: var(--color-text-secondary); font-size: .8rem; }
  `],
})
export class DynamicFormBuilderPage implements OnInit, DynamicFormBuilderView {
  private presenter = inject(DynamicFormBuilderPresenter);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);
  private toast = inject(ToastService);
  private uploads = inject(UploadService);

  readonly path = dynamicFormPath;
  readonly groups = FIELD_TYPE_GROUPS;
  readonly statusMeta = statusMeta;
  formId = Number(this.route.snapshot.paramMap.get('id'));
  form = signal<DynamicForm | null>(null);
  busy = signal(false);

  showModal = signal(false);
  editFieldId: number | null = null;
  fieldForm: FieldFormValue = emptyFieldForm();

  fields = computed(() => (this.form()?.fields ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
  otherFields = computed(() => this.fields().filter((f) => !isDisplayField(f.fieldType)));

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadForm(this.formId);
  }

  typesInGroup(group: string) { return FIELD_TYPES.filter((t) => t.group === group); }
  fieldTypeLabel = fieldTypeLabel;
  isDisplay = isDisplayField;
  isOptionType(t: DynamicFieldType): boolean { return OPTION_FIELD_TYPES.includes(t); }

  openCreate(type: DynamicFieldType): void {
    this.editFieldId = null;
    this.fieldForm = emptyFieldForm(type);
    this.showModal.set(true);
  }

  openEdit(f: DynamicFormField): void {
    this.editFieldId = f.fieldID;
    const v = f.validation ?? {};
    const cfg = f.fieldConfig ?? {};
    const cond = f.conditionalLogic?.conditions?.[0];
    this.fieldForm = {
      fieldType: f.fieldType, label: f.label, placeholder: f.placeholder ?? '', helpText: f.helpText ?? '',
      isRequired: f.isRequired,
      options: (f.options ?? []).map((o) => ({ label: o.label, value: o.value })),
      vMin: v.min ?? null, vMax: v.max ?? null, vPattern: v.pattern ?? '',
      vAcceptedTypes: (v.acceptedTypes ?? []).join(', '), vMaxSizeKB: v.maxSizeKB ?? null,
      cfgMinValue: cfg.minValue ?? null, cfgMaxValue: cfg.maxValue ?? null,
      cfgMinLabel: cfg.minLabel ?? '', cfgMaxLabel: cfg.maxLabel ?? '', cfgMaxRating: cfg.maxRating ?? null,
      condFieldID: cond?.fieldID ?? null, condOperator: cond?.operator ?? 'eq', condValue: cond?.value ?? '',
      condAction: f.conditionalLogic?.action ?? 'show',
      imageURL: f.fieldType === 'image' ? (f.helpText ?? '') : '',
    };
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  addOption(): void { this.fieldForm.options = [...this.fieldForm.options, { label: '', value: '' }]; }
  removeOption(i: number): void { this.fieldForm.options = this.fieldForm.options.filter((_, idx) => idx !== i); }

  onImagePicked(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploads.uploadImage(file, file.name).subscribe({
      next: (r) => { this.fieldForm.imageURL = r.url; this.toast.success('Gambar diunggah'); },
      error: () => this.toast.error('Gagal mengunggah gambar'),
    });
  }

  private buildBody(): Record<string, unknown> {
    const f = this.fieldForm;
    const isOpt = this.isOptionType(f.fieldType);
    const validation: Record<string, unknown> = {};
    if (f.vMin != null) validation['min'] = Number(f.vMin);
    if (f.vMax != null) validation['max'] = Number(f.vMax);
    if (f.vPattern) validation['pattern'] = f.vPattern;
    const accepted = f.vAcceptedTypes.split(',').map((s) => s.trim()).filter(Boolean);
    if (accepted.length) validation['acceptedTypes'] = accepted;
    if (f.vMaxSizeKB != null) validation['maxSizeKB'] = Number(f.vMaxSizeKB);

    const fieldConfig: Record<string, unknown> = {};
    if (f.fieldType === 'linear_scale') {
      fieldConfig['minValue'] = Number(f.cfgMinValue ?? 1);
      fieldConfig['maxValue'] = Number(f.cfgMaxValue ?? 5);
      if (f.cfgMinLabel) fieldConfig['minLabel'] = f.cfgMinLabel;
      if (f.cfgMaxLabel) fieldConfig['maxLabel'] = f.cfgMaxLabel;
    }
    if (f.fieldType === 'rating') fieldConfig['maxRating'] = Number(f.cfgMaxRating ?? 5);

    const conditionalLogic = f.condFieldID
      ? { action: f.condAction, match: 'all', conditions: [{ fieldID: Number(f.condFieldID), operator: f.condOperator, value: f.condValue }] }
      : null;

    return {
      fieldType: f.fieldType,
      label: f.label.trim(),
      placeholder: f.placeholder.trim() || null,
      helpText: f.helpText.trim() || null,
      isRequired: f.isRequired,
      options: isOpt ? f.options.filter((o) => o.label && o.value) : [],
      validation: Object.keys(validation).length ? validation : null,
      fieldConfig: Object.keys(fieldConfig).length ? fieldConfig : null,
      conditionalLogic,
      imageURL: f.fieldType === 'image' ? (f.imageURL || null) : null,
    };
  }

  save(): void {
    const body = this.buildBody();
    if (this.editFieldId) this.presenter.updateField(this.formId, this.editFieldId, body);
    else this.presenter.addField(this.formId, body);
    this.closeModal();
  }

  async remove(f: DynamicFormField, event?: Event): Promise<void> {
    if (f.isSystemField) { this.toast.error('Field sistem tidak bisa dihapus'); return; }
    const ok = await this.alert.confirm(`Hapus field "${f.label}"?`, {
      title: 'Hapus Field', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.removeField(this.formId, f.fieldID);
  }

  move(i: number, dir: -1 | 1): void {
    const arr = this.fields().map((f) => f.fieldID);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.presenter.reorder(this.formId, arr);
  }

  async setStatus(status: string): Promise<void> {
    const ok = await this.alert.confirm(
      status === 'published' ? 'Publikasikan formulir? Tautan publik akan aktif.' : `Ubah status formulir menjadi "${status}"?`,
      { title: 'Ubah Status', confirmLabel: 'Ya' },
    );
    if (!ok) return;
    this.presenter.setStatus(this.formId, status);
  }

  setForm(form: DynamicForm): void { this.form.set(form); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  reload(): void { this.presenter.loadForm(this.formId); }
}
