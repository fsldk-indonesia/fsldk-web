import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { OrgPickerComponent, OrgPickerOption } from '../../../../shared/org-picker.component';
import { PdfUploadComponent } from '../../../../shared/pdf-upload.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { FormField, FormSection, FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { FieldError } from '../../../../core/entities/api-response';
import {
  SubmissionDetail, FORM_CODE_LEVELISASI, FORM_CODE_SENSUS_KADER, EDITABLE_STATUSES,
  SUBMISSION_STATUS_LABELS, statusTone, displayStatus,
} from '../../entities/submission';
import { SubmissionPendataanPresenter } from './submission.pendataan.presenter';
import { SubmissionPendataanView } from './submission.pendataan.view';

interface AnswerDraft {
  text: string;
  number: number | null;
  date: string;
  optionID: number | null;
  optionIDs: number[];
  fileURL: string;
  fileName: string;
  /** Isian manual saat opsi "Lainnya" dipilih. */
  otherText: string;
}

const emptyDraft = (): AnswerDraft => ({ text: '', number: null, date: '', optionID: null, optionIDs: [], fileURL: '', fileName: '', otherText: '' });

@Component({
  selector: 'app-submission-pendataan-page',
  standalone: true,
  templateUrl: './submission.pendataan.page.html',
  imports: [FormsModule, RouterLink, IconComponent, SelectComponent, OrgPickerComponent, PdfUploadComponent, ImageUploadComponent, DateTimePickerComponent],
  providers: [SubmissionPendataanPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .status-banner { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: var(--radius-md); background: var(--color-bg-warm); margin-bottom: 20px; }
    .status-banner.tone-danger { background: #fdecec; color: #9a1c1c; }
    .status-banner.tone-warning { background: var(--color-ember-soft); color: var(--color-ember-dark); }
    .status-banner.tone-neutral { background: var(--color-bg-alt); color: var(--color-muted); }
    .status-banner.tone-success { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .section-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 18px; margin-bottom: 16px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 14px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .section-desc { margin: -8px 0 14px; }
    .field-group { margin-top: 16px; }
    .field-label { font-weight: 600; font-size: .92rem; margin-bottom: 6px; display: block; }
    .field-label { margin-bottom: 2px; }
    .field-help { color: var(--color-muted); font-size: .74rem; line-height: 1.35; margin: 0 0 6px; }
    .form-control.is-invalid { border-color: var(--color-danger); background-color: #fffbfa; }
    .has-error ::ng-deep .app-select-control,
    .has-error ::ng-deep .dtp-trigger { border-color: var(--color-danger); background-color: #fffbfa; }
    .has-error .field-label { color: var(--color-danger); }
    .radio-list, .check-list { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
    .actions-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 24px; }
    .actions-bar .spacer { flex: 1 1 auto; }
    .wizard-head { margin-bottom: 16px; scroll-margin-top: 90px; }
    .wizard-meta { display: flex; justify-content: space-between; align-items: baseline; font-size: .82rem; color: var(--color-muted); margin-bottom: 6px; }
    .wizard-meta strong { color: var(--color-text); font-weight: 700; }
    .wizard-bar { height: 8px; border-radius: 999px; background: var(--color-bg-alt); overflow: hidden; }
    .wizard-bar-fill { height: 100%; width: 100%; border-radius: 999px; background: var(--color-primary); transform-origin: left center; transition: transform var(--motion-slow, .3s) var(--ease-out, ease-out); }
    .wizard-dots { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; padding: 0; list-style: none; }
    .wizard-dot {
      width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--color-border); background: #fff;
      font-size: .74rem; font-weight: 700; color: var(--color-muted); display: inline-flex; align-items: center; justify-content: center; padding: 0;
    }
    .wizard-dot.done { background: var(--color-primary-soft); color: var(--color-primary-dark); border-color: transparent; cursor: pointer; }
    .wizard-dot.current { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .wizard-dot:disabled { cursor: default; }
    @media (prefers-reduced-motion: reduce) { .wizard-bar-fill { transition: none; } }
    .answers-title { font-size: 1.05rem; margin: 22px 0 12px; }
    .section-card dl { margin: 0; }
    .section-card .answer-view:last-child { border-bottom: 0; padding-bottom: 0; }
    .answer-view { padding: 10px 0; border-bottom: 1px solid var(--color-border); }
    .answer-view dt { font-weight: 600; font-size: .88rem; }
    .answer-view dd { color: var(--color-text-secondary); margin: 2px 0 0; overflow-wrap: break-word; word-break: break-word; }
    .empty-state-inline { padding: 36px 20px 24px; }
    .err { display: flex; align-items: flex-start; gap: 5px; color: var(--color-danger); font-size: .8rem; margin-top: 6px; }
    .err app-icon { flex: none; margin-top: 1px; }
    .other-input { margin-top: 8px; }
  `],
})
export class SubmissionPendataanPage implements OnInit, SubmissionPendataanView {
  private presenter = inject(SubmissionPendataanPresenter);
  private route = inject(ActivatedRoute);
  private orgContext = inject(OrgContextService);
  private alert = inject(AlertService);
  private auth = inject(AuthRepository);

  /** LDK yang sedang dibuka lewat org-switcher (shell cms-ldk) — relevan
   *  hanya untuk subjek Levelisasi (bukan Kader, yang memilih LDK Tujuan
   *  sendiri lewat selectedOrgID). Dipakai Puskomda/Puskomnas mengisi
   *  Pendataan atas nama LDK di bawahnya (2026-08-18). */
  private targetOrganizationID: number | undefined;

  /** formCode ditentukan oleh shell/route yang memuat halaman ini (data:
   *  {formCode}) — cms-ldk selalu Levelisasi LDK, kader selalu Sensus Kader —
   *  BUKAN dari tier akun pemanggil. Sebelumnya dihitung dari
   *  auth.user()?.organizationTypeCode, yang salah untuk Super Admin/wildcard
   *  (organizationTypeCode kosong) sehingga cms-ldk/submissions/pendataan
   *  ikut menampilkan form Sensus Kader alih-alih Levelisasi LDK (miss-
   *  development-prompt-2.md poin 7). */
  formCode = computed(() => (this.route.snapshot.data['formCode'] as string | undefined) ?? FORM_CODE_LEVELISASI);
  isKaderSubject = computed(() => this.formCode() === FORM_CODE_SENSUS_KADER);

  version = signal<FormVersionDetail | null>(null);
  submission = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);
  /** Daftar LENGKAP LDK nasional (directory(), lihat presenter) — difilter
   *  client-side oleh ldkOptions() mengikuti ketikan di app-org-picker
   *  (searchChange), bukan query server per keystroke. */
  allLdkOptions = signal<OrgPickerOption[]>([]);
  ldkSearch = signal('');
  ldkOptions = computed<OrgPickerOption[]>(() => {
    const q = this.ldkSearch().trim().toLowerCase();
    if (!q) return this.allLdkOptions();
    return this.allLdkOptions().filter((o) =>
      o.name.toLowerCase().includes(q) || (o.parentName ?? '').toLowerCase().includes(q));
  });
  selectedOrgID: number | null = null;

  /** LDK Tujuan Kader terkunci seumur hidup begitu submission pertamanya
   *  dibuat (lihat ms_user.organizationID di submission_service_impl.go) —
   *  begitu terisi, dropdown "Pilih LDK" tidak relevan lagi ditampilkan
   *  (termasuk saat retry setelah CANCELLED, lihat ldkLocked di template)
   *  karena pilihan apa pun di situ akan diabaikan backend. */
  ldkLocked = computed(() => this.isKaderSubject() && this.auth.user()?.ldkTujuanOrganizationID != null);

  answers = signal<Record<number, AnswerDraft>>({});
  fieldErrors = signal<Record<string, string>>({});
  fieldError(fieldID: number): string { return this.fieldErrors()[`field_${fieldID}`] ?? ''; }

  // ---------- Wizard per section ----------
  private step = signal(0);

  /** Section yang punya minimal satu field terlihat (field kondisional bisa
   *  menyembunyikan seluruh section). */
  visibleSections(): FormSection[] {
    return (this.version()?.sections ?? []).filter((s) => s.fields.some((f) => this.isFieldVisible(f)));
  }
  stepIndex(): number {
    return Math.min(this.step(), Math.max(this.visibleSections().length - 1, 0));
  }
  currentSection(): FormSection | undefined { return this.visibleSections()[this.stepIndex()]; }
  isFirstStep(): boolean { return this.stepIndex() === 0; }
  isLastStep(): boolean { return this.stepIndex() >= this.visibleSections().length - 1; }
  progressPercent(): number {
    const n = this.visibleSections().length;
    return n ? Math.round(((this.stepIndex() + 1) / n) * 100) : 0;
  }
  progressScale(): string { return `scaleX(${this.progressPercent() / 100})`; }

  private scrollToWizardTop(): void {
    setTimeout(() => document.querySelector('.wizard-head')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 0);
  }
  goToStep(i: number): void {
    if (i >= this.stepIndex()) return; // maju hanya lewat "Selanjutnya" (divalidasi per section)
    this.step.set(i);
    this.scrollToWizardTop();
  }
  prevStep(): void {
    if (this.isFirstStep()) return;
    this.step.set(this.stepIndex() - 1);
    this.scrollToWizardTop();
  }
  nextStep(): void {
    const sec = this.currentSection();
    if (!sec) return;
    const bad = sec.fields.filter((f) => this.validateField(f, true) !== '');
    if (bad.length) {
      this.touched.update((s) => { const n = new Set(s); bad.forEach((f) => n.add(f.fieldID)); sec.fields.forEach((f) => n.add(f.fieldID)); return n; });
      this.scrollToFirstError();
      return;
    }
    this.step.set(this.stepIndex() + 1);
    this.scrollToWizardTop();
  }
  /** Pindah ke section yang memuat field tertentu (dipakai saat Kirim/Simpan
   *  menemukan error di section lain, atau error dari server). */
  private jumpToFieldSection(fieldID: number): void {
    const idx = this.visibleSections().findIndex((s) => s.fields.some((f) => f.fieldID === fieldID));
    if (idx >= 0) this.step.set(idx);
  }

  /** Kembalikan wizard ke awal & bersihkan penanda error. Dipanggil saat
   *  berpindah LDK (org-switcher) atau ke pendataan lain — halaman ini tidak
   *  dibuat ulang saat itu, jadi tanpa reset posisi section & error merah dari
   *  LDK sebelumnya terbawa. */
  private resetWizard(): void {
    this.step.set(0);
    this.touched.set(new Set());
    this.otherTouched.set(new Set());
    this.submitTried.set(false);
    this.requiredTried.set(false);
    this.fieldErrors.set({});
  }
  private lastSubmissionID: number | null = null;

  /** Field yang sudah disentuh user (blur/ubah) + flag percobaan simpan/kirim —
   *  pesan validasi klien baru tampil setelah salah satunya terjadi, supaya form
   *  kosong tidak langsung penuh merah. */
  private touched = signal<Set<number>>(new Set());
  private submitTried = signal(false);
  /** Kolom isian "Lainnya" yang sudah ditinggalkan (blur) — "wajib diisi"-nya baru tampil setelah itu. */
  private otherTouched = signal<Set<number>>(new Set());
  touchOther(field: FormField): void {
    if (this.otherTouched().has(field.fieldID)) return;
    this.otherTouched.update((s) => new Set(s).add(field.fieldID));
  }
  /** "Wajib diisi" hanya ditampilkan setelah user mencoba Kirim/Selanjutnya (atau
   *  menyentuh field-nya). Simpan Draf TIDAK menuntut field wajib, jadi tidak
   *  boleh memunculkan error merah "wajib diisi" yang membingungkan. */
  private requiredTried = signal(false);

  touch(field: FormField): void {
    if (this.touched().has(field.fieldID)) return;
    this.touched.update((s) => new Set(s).add(field.fieldID));
  }

  /** Dipanggil tiap jawaban berubah: tandai disentuh & buang error dari server
   *  untuk field itu (sudah tidak relevan setelah diedit). */
  onEdit(field: FormField): void {
    this.touch(field);
    if (this.fieldErrors()[`field_${field.fieldID}`]) {
      this.fieldErrors.update((m) => { const n = { ...m }; delete n[`field_${field.fieldID}`]; return n; });
    }
  }

  /** Pesan error yang ditampilkan untuk satu field ('' = valid / belum perlu tampil). */
  errorFor(field: FormField): string {
    const server = this.fieldError(field.fieldID);
    if (server) return server;
    if (!this.submitTried() && !this.touched().has(field.fieldID)) return '';
    return this.validateField(
      field,
      this.requiredTried() || this.touched().has(field.fieldID),
      this.requiredTried() || this.otherTouched().has(field.fieldID),
    );
  }

  /** Cermin validasi backend (submission_service_impl.go: fieldValidationRule +
   *  collectMissingRequiredFields) supaya error muncul sebelum request dikirim. */
  private validateField(field: FormField, checkRequired: boolean, strictOther: boolean = checkRequired): string {
    const d = this.answers()[field.fieldID];
    if (!d || !this.isFieldVisible(field)) return '';
    const rule = (field.validationRule ?? {}) as { regex?: string; min?: number; max?: number; minLength?: number; maxLength?: number };
    let filled = false;
    switch (field.fieldType) {
      case 'TEXT': case 'TEXTAREA': {
        const v = d.text.trim();
        filled = v !== '';
        if (filled) {
          if (rule.minLength != null && v.length < rule.minLength) return `${field.fieldLabel}: panjang minimal ${rule.minLength} karakter (saat ini ${v.length})`;
          if (rule.maxLength != null && v.length > rule.maxLength) return `${field.fieldLabel}: panjang maksimal ${rule.maxLength} karakter (saat ini ${v.length})`;
          if (rule.regex) {
            try { if (!new RegExp(rule.regex).test(v)) return `${field.fieldLabel}: format tidak sesuai`; } catch { /* regex tidak valid: lewati, backend yang menilai */ }
          }
        }
        break;
      }
      case 'NUMBER':
        filled = d.number != null && `${d.number}` !== '';
        if (filled) {
          if (rule.min != null && d.number! < rule.min) return `${field.fieldLabel}: nilai minimal ${rule.min}`;
          if (rule.max != null && d.number! > rule.max) return `${field.fieldLabel}: nilai maksimal ${rule.max}`;
        }
        break;
      case 'DATE': filled = d.date !== ''; break;
      case 'SELECT': case 'RADIO': filled = d.optionID != null; break;
      case 'MULTISELECT': case 'CHECKBOX': filled = d.optionIDs.length > 0; break;
      case 'FILE_DOCUMENT': case 'FILE_IMAGE': filled = d.fileURL !== ''; break;
    }
    if (checkRequired && field.isRequired && !filled) return `${field.fieldLabel} wajib diisi`;
    // Opsi "Lainnya" terpilih: isian manual wajib & maksimal 500 karakter (draf boleh kosong).
    if (this.isOtherSelected(field)) {
      const t = d.otherText.trim();
      if (t.length > 500) return `${field.fieldLabel}: isian Lainnya maksimal 500 karakter (saat ini ${t.length})`;
      if (strictOther && t === '') return `${field.fieldLabel}: isian Lainnya wajib diisi`;
    }
    return '';
  }

  /** Validasi semua field terlihat sebelum simpan/kirim. Draf tidak menuntut
   *  field wajib (hanya format), kirim menuntut semuanya. Bila ada yang salah:
   *  tampilkan error di field & scroll ke field pertama yang bermasalah. */
  private validateBeforeSend(checkRequired: boolean): boolean {
    this.submitTried.set(true);
    if (checkRequired) this.requiredTried.set(true);
    const bad = this.allFields().find((f) => this.validateField(f, checkRequired) !== '');
    if (bad) {
      this.jumpToFieldSection(bad.fieldID);
      this.scrollToFirstError();
    }
    return !bad;
  }

  private scrollToFirstError(): void {
    // Jeda sedikit agar section tujuan (bila baru berpindah) sudah ter-render.
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.field-group.has-error');
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.querySelector<HTMLElement>('input, textarea, button, [tabindex]')?.focus({ preventScroll: true });
    }, 60);
  }

  isEditable = computed(() => {
    const s = this.submission();
    return s !== null && EDITABLE_STATUSES.includes(s.status);
  });

  readonly statusLabels = SUBMISSION_STATUS_LABELS;
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }
  statusTone(code: string): string { return statusTone(code); }

  /** Banner "Status pendataan Anda saat ini" HARUS pakai status keanggotaan
   *  kader untuk subjek Kader — lihat displayStatus() di entities/submission.ts
   *  (bug yang sama sudah ditemukan & diperbaiki di 3 halaman Portal Kader). */
  topStatusLabel(): string {
    const s = this.submission();
    return s ? displayStatus(s, this.isKaderSubject()).label : '';
  }
  topStatusTone(): string {
    const s = this.submission();
    return s ? displayStatus(s, this.isKaderSubject()).tone : 'neutral';
  }

  /** "Isi Ulang Pendataan" (kader ACTIVE) hanya tampil bila Puskomnas sudah
   *  mempublikasikan version form baru sejak submission ini terakhir diisi —
   *  tanpa itu, tombol tidak relevan (data sudah versi terbaru). */
  canReassessKader = computed(() => {
    const s = this.submission();
    const v = this.version();
    return this.isKaderSubject() && s?.status === 'ACTIVE' && v !== null && v.versionID !== s.formVersionID;
  });

  reassessKader(): void {
    const s = this.submission();
    if (!s) return;
    this.presenter.reassessKader(s.submissionID, s.version);
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    if (this.isKaderSubject()) {
      this.presenter.loadAll(this.formCode());
      this.presenter.loadLdkOptions();
      this.selectedOrgID = this.auth.user()?.ldkTujuanOrganizationID ?? null;
    } else {
      this.orgContext.organizationID$(this.route).subscribe((id) => {
        this.targetOrganizationID = id;
        this.resetWizard();
        this.presenter.loadAll(this.formCode(), id);
      });
    }
  }

  allFields(): FormField[] {
    return (this.version()?.sections ?? []).flatMap((s) => s.fields);
  }
  findField(fieldID: number): FormField | undefined {
    return this.allFields().find((f) => f.fieldID === fieldID);
  }

  answerAsString(field: FormField, draft: AnswerDraft): string {
    if (draft.optionID != null) return field.options.find((o) => o.optionID === draft.optionID)?.optionValue ?? '';
    if (draft.text) return draft.text;
    if (draft.number != null) return String(draft.number);
    if (draft.date) return draft.date;
    return '';
  }

  /** Teks jawaban untuk tampilan baca-saja: opsi tampil sebagai LABEL (bukan
   *  nilai kode seperti "4"), pilihan ganda digabung, file tampil nama berkasnya.
   *  answerAsString() sengaja tetap memakai nilai opsi — itu dipakai untuk
   *  evaluasi aturan kondisional. */
  answerDisplay(field: FormField, draft: AnswerDraft | undefined): string {
    if (!draft) return '';
    const withOther = (o: { optionLabel: string; isOther?: boolean } | undefined): string | undefined =>
      o ? (o.isOther && draft.otherText ? `${o.optionLabel}: ${draft.otherText}` : o.optionLabel) : undefined;
    if (draft.optionID != null) return withOther(field.options.find((o) => o.optionID === draft.optionID)) ?? '';
    if (draft.optionIDs.length) {
      return draft.optionIDs.map((id) => withOther(field.options.find((o) => o.optionID === id))).filter(Boolean).join(', ');
    }
    if (draft.fileURL) return draft.fileName || draft.fileURL;
    return this.answerAsString(field, draft);
  }

  /** True bila jawaban saat ini memilih opsi "Lainnya" (menampilkan kolom isian manual). */
  isOtherSelected(field: FormField): boolean {
    const d = this.answers()[field.fieldID];
    if (!d) return false;
    return field.options.some((o) => o.isOther && (o.optionID === d.optionID || d.optionIDs.includes(o.optionID)));
  }

  isFieldVisible(field: FormField): boolean {
    if (!field.conditionalOnFieldID || !field.conditionalRule) return true;
    const triggerField = this.findField(field.conditionalOnFieldID);
    const triggerDraft = this.answers()[field.conditionalOnFieldID];
    if (!triggerField || !triggerDraft) return false;
    const actual = this.answerAsString(triggerField, triggerDraft);
    if (!actual) return false;
    return field.conditionalRule.operator === 'notEquals' ? actual !== field.conditionalRule.value : actual === field.conditionalRule.value;
  }

  optionSelectOptions(field: FormField): SelectOption[] {
    return field.options.filter((o) => o.isActive).map((o) => ({ value: o.optionID, label: o.optionLabel }));
  }

  toggleMultiOption(field: FormField, optionID: number): void {
    const draft = this.answers()[field.fieldID];
    const set = new Set(draft.optionIDs);
    set.has(optionID) ? set.delete(optionID) : set.add(optionID);
    draft.optionIDs = [...set];
    this.answers.update((m) => ({ ...m, [field.fieldID]: draft }));
  }

  onFileChange(field: FormField, url: string): void {
    const draft = this.answers()[field.fieldID];
    draft.fileURL = url;
    draft.fileName = url ? url.split('/').pop() ?? '' : '';
    this.answers.update((m) => ({ ...m, [field.fieldID]: draft }));
  }

  private buildAnswerInputs(): unknown[] {
    const out: unknown[] = [];
    for (const field of this.allFields()) {
      if (!this.isFieldVisible(field)) continue;
      const draft = this.answers()[field.fieldID];
      if (!draft) continue;
      const input: Record<string, unknown> = { fieldID: field.fieldID };
      switch (field.fieldType) {
        case 'TEXT': case 'TEXTAREA':
          if (!draft.text) continue;
          input['valueText'] = draft.text;
          break;
        case 'NUMBER':
          if (draft.number == null) continue;
          input['valueNumber'] = draft.number;
          break;
        case 'DATE':
          if (!draft.date) continue;
          input['valueDate'] = draft.date;
          break;
        case 'SELECT': case 'RADIO':
          if (draft.optionID == null) continue;
          input['valueOptionID'] = draft.optionID;
          if (this.isOtherSelected(field)) input['valueOtherText'] = draft.otherText;
          break;
        case 'MULTISELECT': case 'CHECKBOX':
          if (draft.optionIDs.length === 0) continue;
          input['valueOptionIDs'] = draft.optionIDs;
          if (this.isOtherSelected(field)) input['valueOtherText'] = draft.otherText;
          break;
        case 'FILE_DOCUMENT': case 'FILE_IMAGE':
          if (!draft.fileURL) continue;
          input['valueFileURL'] = draft.fileURL;
          input['valueFileName'] = draft.fileName;
          break;
      }
      out.push(input);
    }
    return out;
  }

  start(): void {
    this.presenter.create(this.formCode(), this.isKaderSubject() ? this.selectedOrgID : null, this.targetOrganizationID);
  }

  saveDraft(): void {
    const s = this.submission();
    if (!s) return;
    this.fieldErrors.set({});
    if (!this.validateBeforeSend(false)) return;
    this.presenter.saveAnswers(s.submissionID, this.buildAnswerInputs(), () => this.reload());
  }

  submitForm(): void {
    const s = this.submission();
    if (!s) return;
    this.fieldErrors.set({});
    if (!this.validateBeforeSend(true)) return;
    this.presenter.submit(s.submissionID, this.buildAnswerInputs());
  }

  async cancel(event?: Event): Promise<void> {
    const s = this.submission();
    if (!s) return;
    const ok = await this.alert.confirm('Batalkan pendataan ini? Seluruh jawaban yang tersimpan akan hilang.', {
      title: 'Batalkan Pendataan', confirmLabel: 'Ya, Batalkan', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.cancel(s.submissionID);
  }

  private buildAnswerMap(detail: SubmissionDetail | null): Record<number, AnswerDraft> {
    const map: Record<number, AnswerDraft> = {};
    for (const field of this.allFields()) map[field.fieldID] = emptyDraft();
    if (detail) {
      for (const a of detail.answers) {
        const draft = map[a.fieldID] ?? emptyDraft();
        draft.text = a.valueText ?? '';
        draft.number = a.valueNumber ?? null;
        draft.date = a.valueDate ?? '';
        draft.optionID = a.valueOptionID ?? null;
        draft.optionIDs = a.valueOptionIDs ?? [];
        draft.fileURL = a.valueFileURL ?? '';
        draft.fileName = a.valueFileName ?? '';
        draft.otherText = a.valueOtherText ?? '';
        map[a.fieldID] = draft;
      }
    }
    return map;
  }

  setVersion(version: FormVersionDetail): void {
    this.version.set(version);
    this.answers.set(this.buildAnswerMap(this.submission()));
  }
  setSubmission(detail: SubmissionDetail | null): void {
    // Submission berbeda (ganti LDK / mulai baru) → wizard dari awal. Submission
    // yang sama (reload setelah Simpan Draf) → posisi section dipertahankan.
    const id = detail?.submissionID ?? null;
    if (id !== this.lastSubmissionID) { this.lastSubmissionID = id; this.resetWizard(); }
    this.submission.set(detail);
    if (this.version()) this.answers.set(this.buildAnswerMap(detail));
  }
  setLdkOptions(options: OrgPickerOption[]): void { this.allLdkOptions.set(options); }
  onLdkSearch(value: string): void { this.ldkSearch.set(value); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  reload(): void { this.loading.set(true); this.presenter.loadAll(this.formCode(), this.targetOrganizationID); }

  onValidationErrors(errors: FieldError[]): void {
    const map: Record<string, string> = {};
    for (const e of errors) map[e.attribute] = e.message;
    this.fieldErrors.set(map);
    const first = errors.map((e) => /^field_(\d+)$/.exec(e.attribute)).find((m) => m !== null);
    if (first) this.jumpToFieldSection(Number(first[1]));
    this.scrollToFirstError();
  }
}
