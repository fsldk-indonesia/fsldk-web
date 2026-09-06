import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UploadService } from '../../../../core/services/upload.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFieldType, DynamicFormField } from '../../entities/dynamic-form-field';
import {
  FIELD_TYPES, FIELD_TYPE_GROUPS, OPTION_FIELD_TYPES, ROUTING_FIELD_TYPES,
  fieldTypeLabel, isDisplayField, statusMeta,
} from '../../dynamicform.constants';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormBuilderPresenter } from './dynamicform.builder.presenter';
import { DynamicFormBuilderView } from './dynamicform.builder.view';

/** One row of the section-routing editor — one per option of a radio/dropdown. */
interface RoutingRow {
  optionValue: string;
  targetSectionFieldID: number | null;
}

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
  routingEnabled: boolean;
  routingRoutes: RoutingRow[];
  imageURL: string;
}

const emptyFieldForm = (type: DynamicFieldType = 'short_text'): FieldFormValue => ({
  fieldType: type, label: '', placeholder: '', helpText: '', isRequired: false,
  options: type === 'dropdown' || type === 'radio' || type === 'checkbox'
    ? [{ label: 'Opsi 1', value: 'Opsi 1' }, { label: 'Opsi 2', value: 'Opsi 2' }] : [],
  vMin: null, vMax: null, vPattern: '', vAcceptedTypes: '', vMaxSizeKB: null,
  cfgMinValue: type === 'linear_scale' ? 1 : null, cfgMaxValue: type === 'linear_scale' ? 5 : null,
  cfgMinLabel: '', cfgMaxLabel: '', cfgMaxRating: type === 'rating' ? 5 : null,
  routingEnabled: false, routingRoutes: [], imageURL: '',
});

@Component({
  selector: 'app-dynamicform-builder-page',
  standalone: true,
  templateUrl: './dynamicform.builder.page.html',
  imports: [FormsModule, RouterLink, IconComponent, ModalBackdropDirective, SelectComponent],
  providers: [DynamicFormBuilderPresenter],
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .88rem; margin-bottom: 10px; }
    .header-bar { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .header-bar h1 { margin-bottom: 4px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .builder { display: grid; grid-template-columns: 260px minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
    @media (max-width: 1180px) { .builder { grid-template-columns: 240px minmax(0, 1fr); } .builder .sidebar { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; } }
    @media (max-width: 760px) { .builder { grid-template-columns: 1fr; } .builder .sidebar { grid-template-columns: 1fr; } }

    /* col 1 — palette */
    .palette { position: sticky; top: 16px; }
    .col-title { display: flex; align-items: center; gap: 8px; font-size: .95rem; font-weight: 700; }
    .palette h4 { margin: 14px 0 6px; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-muted); }
    .palette h4:first-of-type { margin-top: 10px; }
    .palette button { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; padding: 8px 10px; border: 0; background: transparent; border-radius: var(--radius-xs); cursor: pointer; font-size: .88rem; color: var(--color-text); transition: background var(--motion-fast) ease; }
    .palette button:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }

    /* col 2 — active fields */
    .active-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
    .count-badge { font-size: .74rem; font-weight: 700; color: var(--color-muted); background: var(--color-bg-alt); padding: 3px 10px; border-radius: var(--radius-full); }
    .quick-add { position: sticky; top: 16px; z-index: 5; display: flex; gap: 8px; flex-wrap: wrap; padding: 10px; margin-bottom: 12px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
    .quick-add .btn { flex: 1; min-width: 130px; justify-content: center; }
    .header-image-preview { position: relative; margin-bottom: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    .header-image-preview img { width: 100%; max-height: 150px; object-fit: cover; display: block; }
    .header-image-preview .hi-actions { display: flex; gap: 8px; padding: 8px; background: #fff; }

    .field-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 14px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; transition: box-shadow var(--motion-fast) ease, opacity var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .field-card .grip { color: var(--color-border-strong); cursor: grab; flex-shrink: 0; margin-top: 2px; align-self: center; }
    .field-card .grip:active { cursor: grabbing; }
    .field-card.dragging { opacity: .45; }
    .field-card.drag-over { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-soft); }
    .field-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
    .field-meta .type { font-size: .78rem; color: var(--color-muted); }
    .field-meta .help { font-size: .82rem; color: var(--color-muted); }
    .card-actions { display: flex; gap: 6px; flex-shrink: 0; align-items: center; }

    /* col 3 — sidebar */
    .sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }
    .sidebar-card { padding: 16px; }
    .sidebar-title { display: flex; align-items: center; gap: 8px; font-size: .9rem; font-weight: 700; margin: 0 0 12px; }
    .drive-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border-radius: var(--radius-xs); text-decoration: none; color: var(--color-text); transition: background var(--motion-fast) ease; }
    .drive-row:hover { background: var(--color-bg-alt); }
    .drive-row app-icon { color: var(--color-primary-dark); flex-shrink: 0; margin-top: 1px; }
    .drive-row strong { display: block; font-size: .85rem; }
    .drive-row span { display: block; font-size: .78rem; color: var(--color-muted); }
    .tips-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .tips-list li { display: flex; gap: 8px; font-size: .82rem; color: var(--color-text-secondary); line-height: 1.5; }
    .tips-list li app-icon { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 560px; max-height: 88vh; display: flex; flex-direction: column; }
    .modal > h3 { flex-shrink: 0; margin-bottom: 16px; }
    .modal-body { overflow-y: auto; flex: 1 1 auto; min-height: 0; padding-right: 6px; }
    .modal-footer { flex-shrink: 0; display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; }
    .opt-row { display: flex; gap: 8px; margin-bottom: 6px; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .divider-label { font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-muted);
      font-weight: 700; border-top: 1px solid var(--color-border); padding-top: 14px; margin: 18px 0 12px; }
    .section-card { border-style: dashed; border-color: var(--color-primary); background: var(--color-primary-soft); }
    .add-section-btn { width: 100%; margin-bottom: 10px; }
    .route-row { display: grid; grid-template-columns: 120px 1fr; gap: 10px; align-items: center; margin-bottom: 8px; }
    .route-row .opt-name { font-size: .85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* Live preview */
    .preview-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .preview-toggle button { border: 1px solid var(--color-border); background: #fff; font-size: .78rem; padding: 3px 10px; cursor: pointer; }
    .preview-toggle button:first-child { border-radius: var(--radius-xs) 0 0 var(--radius-xs); }
    .preview-toggle button:last-child { border-radius: 0 var(--radius-xs) var(--radius-xs) 0; border-left: 0; }
    .preview-toggle button.on { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .preview-frame { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-alt); padding: 16px; margin: 8px auto 0; transition: max-width var(--motion-base) ease; }
    .preview-frame.mobile { max-width: 320px; }
    .preview-frame .p-label { font-weight: 600; font-size: .9rem; margin-bottom: 6px; }
    .preview-frame .p-help { font-size: .8rem; color: var(--color-muted); margin-bottom: 8px; }
    .preview-frame .p-ctrl { width: 100%; padding: 9px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; font-size: .88rem; color: var(--color-muted); }
    .preview-frame .p-opt { display: flex; align-items: center; gap: 8px; font-size: .88rem; margin: 4px 0; }
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
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });

  showModal = signal(false);
  editFieldId: number | null = null;
  fieldForm: FieldFormValue = emptyFieldForm();
  previewMode = signal<'desktop' | 'mobile'>('desktop');
  headerImageUploading = signal(false);

  /** Native HTML5 drag-reorder of the active-field list. */
  dragIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);

  fields = computed(() => (this.form()?.fields ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
  otherFields = computed(() => this.fields().filter((f) => !isDisplayField(f.fieldType)));
  /** input fields only — matches the reference's "N fields" badge. */
  fieldCount = computed(() => this.otherFields().length);

  /** section_break fields that come after the field being edited — the valid
   *  forward targets for a routing rule. */
  routingTargetOptions = computed<SelectOption[]>(() => {
    const editing = this.fields().find((f) => f.fieldID === this.editFieldId);
    const after = editing ? editing.sortOrder : -1;
    return this.fields()
      .filter((f) => f.fieldType === 'section_break' && f.sortOrder > after)
      .map((f) => ({ value: f.fieldID, label: f.label || 'Bagian' }));
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadForm(this.formId);
  }

  typesInGroup(group: string) { return FIELD_TYPES.filter((t) => t.group === group && !t.paletteHidden); }
  fieldTypeLabel = fieldTypeLabel;
  isDisplay = isDisplayField;
  isOptionType(t: DynamicFieldType): boolean { return OPTION_FIELD_TYPES.includes(t); }
  canRoute(t: DynamicFieldType): boolean { return ROUTING_FIELD_TYPES.includes(t); }
  hasRouting(f: DynamicFormField): boolean { return !!f.fieldConfig?.sectionRouting?.enabled; }

  openCreate(type: DynamicFieldType, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.editFieldId = null;
    this.fieldForm = emptyFieldForm(type);
    this.showModal.set(true);
  }

  openEdit(f: DynamicFormField, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.editFieldId = f.fieldID;
    const v = f.validation ?? {};
    const cfg = f.fieldConfig ?? {};
    const routing = cfg.sectionRouting;
    this.fieldForm = {
      fieldType: f.fieldType, label: f.label, placeholder: f.placeholder ?? '', helpText: f.helpText ?? '',
      isRequired: f.isRequired,
      options: (f.options ?? []).map((o) => ({ label: o.label, value: o.value })),
      vMin: v.min ?? null, vMax: v.max ?? null, vPattern: v.pattern ?? '',
      vAcceptedTypes: (v.acceptedTypes ?? []).join(', '), vMaxSizeKB: v.maxSizeKB ?? null,
      cfgMinValue: cfg.minValue ?? null, cfgMaxValue: cfg.maxValue ?? null,
      cfgMinLabel: cfg.minLabel ?? '', cfgMaxLabel: cfg.maxLabel ?? '', cfgMaxRating: cfg.maxRating ?? null,
      routingEnabled: !!routing?.enabled,
      routingRoutes: [],
      imageURL: f.fieldType === 'image' ? (f.helpText ?? '') : '',
    };
    this.syncRoutingRoutes(routing?.routes ?? []);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  /** Keep one routing row per current option, preserving any existing targets. */
  syncRoutingRoutes(existing: { optionValue: string; targetSectionFieldID: number }[] = this.fieldForm.routingRoutes as never): void {
    const byValue = new Map(existing.map((r) => [r.optionValue, r.targetSectionFieldID]));
    this.fieldForm.routingRoutes = this.fieldForm.options
      .filter((o) => o.value)
      .map((o) => ({ optionValue: o.value, targetSectionFieldID: byValue.get(o.value) ?? null }));
  }

  addOption(): void {
    this.fieldForm.options = [...this.fieldForm.options, { label: '', value: '' }];
  }
  removeOption(i: number): void {
    this.fieldForm.options = this.fieldForm.options.filter((_, idx) => idx !== i);
    this.syncRoutingRoutes();
  }
  onOptionLabelChange(o: { label: string; value: string }): void {
    o.value = o.label;
    if (this.fieldForm.routingEnabled) this.syncRoutingRoutes();
  }
  toggleRouting(): void {
    this.fieldForm.routingEnabled = !this.fieldForm.routingEnabled;
    if (this.fieldForm.routingEnabled) this.syncRoutingRoutes();
  }

  /** Open the same add-field modal for a section break, so its title and
   *  description (help text) can be set before it is created. */
  addSection(event?: Event): void {
    this.openCreate('section_break', event);
  }

  // --- header image (form-level, edited here in the builder like the reference) ---
  onHeaderImagePicked(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    const form = this.form();
    if (!file || !form) return;
    this.headerImageUploading.set(true);
    this.uploads.uploadImage(file, file.name).subscribe({
      next: (r) => { this.headerImageUploading.set(false); this.presenter.setHeaderImage(this.formId, r.url, form); },
      error: () => { this.headerImageUploading.set(false); this.toast.error('Gagal mengunggah gambar'); },
    });
  }
  async removeHeaderImage(): Promise<void> {
    const form = this.form();
    if (!form) return;
    const ok = await this.alert.confirm('Hapus gambar header formulir?', { title: 'Hapus Gambar Header', confirmLabel: 'Ya, Hapus', variant: 'danger' });
    if (!ok) return;
    this.presenter.setHeaderImage(this.formId, '', form);
  }

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

    // Section routing (radio/dropdown only) — a forward-only jump per option.
    if (this.canRoute(f.fieldType) && f.routingEnabled) {
      const routes = f.routingRoutes
        .filter((r) => r.targetSectionFieldID != null)
        .map((r) => ({ optionValue: r.optionValue, targetSectionFieldID: Number(r.targetSectionFieldID) }));
      fieldConfig['sectionRouting'] = { enabled: routes.length > 0, routes };
    }

    return {
      fieldType: f.fieldType,
      label: f.label.trim(),
      placeholder: f.placeholder.trim() || null,
      helpText: f.helpText.trim() || null,
      isRequired: f.isRequired,
      options: isOpt ? f.options.filter((o) => o.label && o.value) : [],
      validation: Object.keys(validation).length ? validation : null,
      fieldConfig: Object.keys(fieldConfig).length ? fieldConfig : null,
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

  // --- drag reorder ---
  onDragStart(i: number, ev: DragEvent): void {
    this.dragIndex.set(i);
    ev.dataTransfer?.setData('text/plain', String(i));
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }
  onDragOver(i: number, ev: DragEvent): void {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (this.dragOverIndex() !== i) this.dragOverIndex.set(i);
  }
  onDrop(i: number, ev: DragEvent): void {
    ev.preventDefault();
    const from = this.dragIndex();
    this.clearDrag();
    if (from == null || from === i) return;
    const arr = this.fields().map((f) => f.fieldID);
    const [moved] = arr.splice(from, 1);
    arr.splice(i, 0, moved);
    this.presenter.reorder(this.formId, arr);
  }
  onDragEnd(): void { this.clearDrag(); }
  private clearDrag(): void { this.dragIndex.set(null); this.dragOverIndex.set(null); }

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
