import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { FieldError } from '../../../../core/entities/api-response';
import { SelectComponent } from '../../../../shared/select.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { LinkifyTextPipe } from '../../linkify-text.pipe';
import { PublicDynamicForm, SubmitResult } from '../../entities/dynamic-form';
import { DynamicFormField } from '../../entities/dynamic-form-field';
import {
  FormSectionView, buildSections, isDisplayField, reachableSectionIndexes, sectionRoutingTarget,
} from '../../dynamicform.constants';
import { DynamicFormPublicFillPresenter } from './dynamicform.public-fill.presenter';
import { ClosedReason, DynamicFormPublicFillView } from './dynamicform.public-fill.view';

type FillState = 'loading' | 'form' | 'closed' | 'done';

@Component({
  selector: 'app-dynamicform-public-fill-page',
  standalone: true,
  templateUrl: './dynamicform.public-fill.page.html',
  imports: [FormsModule, LinkifyTextPipe, SelectComponent, DateTimePickerComponent],
  providers: [DynamicFormPublicFillPresenter],
  styles: [`
    .wrap { max-width: 720px; margin: 32px auto; padding: 0 16px; }

    /* Header image — its own elevated card, separate from the title card. */
    .header-image-card { background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; margin-bottom: 16px; }
    .header-image-card img { width: 100%; max-height: 240px; object-fit: cover; display: block; }

    /* Title card — white with a rounded green top strip; dark title for contrast. */
    .head-card { position: relative; background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow); padding: 26px 28px 24px; margin-bottom: 16px; }
    .head-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 6px;
      background: var(--color-primary); border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
    .head-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .autosave { margin-left: auto; font-size: .8rem; color: var(--color-muted); white-space: nowrap; }
    .step-chip { display: inline-flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 700;
      color: #fff; background: var(--color-primary); padding: 5px 12px; border-radius: var(--radius-full); }
    .step-chip-name { font-weight: 500; opacity: .92; }
    .head-card h1 { margin: 0 0 8px; font-size: 1.6rem; font-weight: 800; color: var(--color-text); line-height: 1.25; }
    .form-desc { color: var(--color-text-secondary); line-height: 1.7; }
    .form-desc.clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .form-desc a, .help a, .done-card a { color: var(--color-primary-dark); text-decoration: underline; }
    .desc-toggle { margin-top: 6px; padding: 0; background: none; border: 0; color: var(--color-primary-dark); font-size: .82rem;
      font-weight: 600; text-decoration: underline; cursor: pointer; }
    .preview-note { margin-top: 10px; font-size: .85rem; color: var(--color-muted); background: var(--color-bg-alt); border-radius: var(--radius-xs); padding: 8px 12px; }
    .progress { height: 6px; border-radius: 999px; background: var(--color-bg-alt); margin: 18px 0 10px; overflow: hidden; }
    .progress > span { display: block; height: 100%; background: var(--color-primary); transition: width var(--motion-base) ease; }
    .dots { display: flex; gap: 6px; }
    .dots > i { width: 8px; height: 8px; border-radius: 50%; background: var(--color-border-strong); }
    .dots > i.done { background: var(--color-primary); }
    .dots > i.active { background: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .dots > i.skipped { background: var(--color-bg-alt); border: 1px solid var(--color-border-strong); }
    .section-head { background: #fff; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: 16px 22px; margin-bottom: 12px; }
    .section-head h2 { margin: 0 0 4px; font-size: 1.1rem; }
    .fld { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px 22px; margin-bottom: 12px; box-shadow: var(--shadow-sm); }
    label.q { display: block; font-weight: 600; margin-bottom: 6px; color: var(--color-text); }
    .req { color: var(--color-danger); }
    .help { color: var(--color-muted); font-size: .85rem; margin: 2px 0 10px; }
    .opt { display: flex; align-items: center; gap: 12px; margin: 8px 0; font-weight: 400;
      padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      cursor: pointer; transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease; }
    .opt:hover { border-color: var(--color-primary-dark); }
    .opt:has(input:checked) { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .err { color: var(--color-danger); font-size: .82rem; margin-top: 6px; }
    .hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
    .file-chip { display: inline-flex; align-items: center; gap: 10px; max-width: 100%; padding: 8px 10px 8px 14px;
      border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-bg-alt); }
    .file-chip > i { color: var(--color-primary-dark); font-size: .85rem; flex-shrink: 0; }
    .file-chip-name { font-size: .88rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-chip-remove { flex-shrink: 0; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
      border: none; border-radius: 50%; background: transparent; color: var(--color-muted); cursor: pointer; }
    .file-chip-remove:hover { background: rgba(0,0,0,.08); color: var(--color-text); }
    .datetime-split { display: flex; gap: 8px; }
    .datetime-split > * { flex: 1; min-width: 0; }
    .banner { background: var(--color-warning-soft); color: var(--color-warning); border-radius: var(--radius-xs); padding: 12px 16px; margin-bottom: 12px; font-size: .9rem; }
    .done-card, .closed-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 40px 28px; text-align: center; box-shadow: var(--shadow-sm); }
    .stars { font-size: 1.6rem; cursor: pointer; user-select: none; color: var(--color-primary); }
    .scale { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .scale-label { font-size: .82rem; color: var(--color-muted); }
    .scale-item { position: relative; display: inline-flex; }
    .scale-item input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
    .scale-num { display: flex; align-items: center; justify-content: center; min-width: 44px; height: 44px; padding: 0 6px;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); font-weight: 600; color: var(--color-text);
      pointer-events: none; /* clicks pass through to the full-size hidden radio */
      transition: border-color var(--motion-fast) ease, background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .scale-item:hover .scale-num { border-color: var(--color-primary-dark); }
    .scale-item.checked .scale-num { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
    .video-frame { width: 100%; aspect-ratio: 16/9; border: 0; border-radius: 8px; }
    .nav-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .nav-row .grow { flex: 1; }
    .footer-meta { margin-top: 14px; font-size: .8rem; color: var(--color-muted); text-align: center; }
  `],
})
export class DynamicFormPublicFillPage implements OnInit, OnDestroy, DynamicFormPublicFillView {
  private presenter = inject(DynamicFormPublicFillPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthRepository);
  private sanitizer = inject(DomSanitizer);

  state = signal<FillState>('loading');
  form = signal<PublicDynamicForm | null>(null);
  closedMessage = signal('');
  closedReason = signal<ClosedReason | ''>('');
  submitting = signal(false);
  submitResult = signal<SubmitResult | null>(null);
  retryCountdown = signal(0);
  draftSaved = signal(false);
  /** Autosave is only wired for logged-in respondents; drives the top indicator. */
  draftEnabled = signal(false);
  /** Form description is clamped on inner sections until the reader expands it. */
  descExpanded = signal(false);
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private slug = '';

  /** answers keyed "field_<id>": string, or string[] for checkbox. */
  answers: Record<string, string | string[]> = {};
  fieldErrors: Record<string, string> = {};
  stagedFiles: Record<number, string> = {};
  pendingFiles: Record<number, File> = {};
  private formTs = Date.now();
  honeypot = '';

  // --- multi-step state ---
  sectionIdx = signal(0);
  private sectionHistory: number[] = [];
  skippedIdx = signal<ReadonlySet<number>>(new Set());

  sections = computed<FormSectionView[]>(() => {
    const f = this.form();
    return f ? buildSections(f.fields, f.title, f.description) : [];
  });
  isMultiStep = computed(() => this.sections().length > 1);
  currentSection = computed<FormSectionView | null>(() => this.sections()[this.sectionIdx()] ?? null);
  currentFields = computed<DynamicFormField[]>(() =>
    this.isMultiStep() ? (this.currentSection()?.fields ?? []) : this.fields(),
  );

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.presenter.init(this.slug);
  }

  ngOnDestroy(): void {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  isDisplay = isDisplayField;
  isSystemEmail(f: DynamicFormField): boolean { return f.isSystemField && f.fieldType === 'email'; }

  fields(): DynamicFormField[] {
    return (this.form()?.fields ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ---------------------------------------------------------------------------
  // section navigation
  // ---------------------------------------------------------------------------

  hasNextSection(): boolean {
    for (let i = this.sectionIdx() + 1; i < this.sections().length; i++) {
      if (!this.skippedIdx().has(i)) return true;
    }
    return false;
  }

  stepLabel(): string {
    let pos = 1;
    for (let i = 0; i < this.sectionIdx(); i++) if (!this.skippedIdx().has(i)) pos++;
    const total = this.sections().length - this.skippedIdx().size;
    return `Bagian ${pos} dari ${total}`;
  }

  progressPct(): number {
    const total = this.sections().length - this.skippedIdx().size;
    let pos = 1;
    for (let i = 0; i < this.sectionIdx(); i++) if (!this.skippedIdx().has(i)) pos++;
    return total <= 1 ? 100 : Math.round(((pos - 1) / (total - 1)) * 100);
  }

  dotState(i: number): 'done' | 'active' | 'skipped' | 'pending' {
    if (this.skippedIdx().has(i)) return 'skipped';
    if (i === this.sectionIdx()) return 'active';
    if (i < this.sectionIdx()) return 'done';
    return 'pending';
  }

  next(): void {
    const cur = this.sectionIdx();
    if (!this.validateSectionRequired(cur)) {
      this.scrollToFirstError();
      return;
    }
    this.presenter.flushDraftSave(this.nonFileAnswers());

    // Recompute skips from the fresh answers: clear everything past `cur` first.
    const skipped = new Set(this.skippedIdx());
    for (const i of [...skipped]) if (i > cur) skipped.delete(i);

    const target = sectionRoutingTarget(this.sections(), cur, this.answers);
    let dest = cur + 1;
    if (target != null && target > cur) {
      for (let i = cur + 1; i < target; i++) skipped.add(i);
      dest = target;
    }
    this.skippedIdx.set(skipped);
    this.sectionHistory.push(cur);
    this.goTo(dest);
  }

  prev(): void {
    const back = this.sectionHistory.pop();
    this.goTo(back ?? Math.max(0, this.sectionIdx() - 1));
  }

  private goTo(idx: number): void {
    this.sectionIdx.set(Math.min(idx, this.sections().length - 1));
    this.descExpanded.set(false);
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  private validateSectionRequired(idx: number): boolean {
    let ok = true;
    for (const f of this.sections()[idx]?.fields ?? []) {
      if (isDisplayField(f.fieldType) || !f.isRequired) continue;
      const key = `field_${f.fieldID}`;
      if (f.fieldType === 'file') {
        if (!this.stagedFiles[f.fieldID] && !this.pendingFiles[f.fieldID]) {
          this.fieldErrors[key] = `${f.label} wajib diunggah`;
          ok = false;
        }
        continue;
      }
      const v = this.answers[key];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
        this.fieldErrors[key] = `${f.label} wajib diisi`;
        ok = false;
      }
    }
    return ok;
  }

  private scrollToFirstError(): void {
    queueMicrotask(() => {
      document.querySelector('.err')?.closest('.fld')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  // ---------------------------------------------------------------------------
  // field helpers
  // ---------------------------------------------------------------------------

  scaleRange(f: DynamicFormField): number[] {
    const cfg = f.fieldConfig ?? {};
    const min = cfg.minValue ?? 1;
    const max = cfg.maxValue ?? 5;
    const out: number[] = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
  }
  ratingRange(f: DynamicFormField): number[] {
    const n = f.fieldConfig?.maxRating ?? 5;
    return Array.from({ length: n }, (_, i) => i + 1);
  }
  videoEmbedUrl(raw: string | null): SafeResourceUrl {
    const url = (raw ?? '').trim();
    const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
    const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    const embed = yt ? `https://www.youtube.com/embed/${yt[1]}`
      : drive ? `https://drive.google.com/file/d/${drive[1]}/preview`
      : url;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  // --- phone: a single leading "+" then digits only. Rewrite the input's DOM
  // value directly so an illegal char can't stick when the sanitized string is
  // unchanged (one-way [ngModel] would skip the re-render). ---
  onPhoneInput(f: DynamicFormField, el: HTMLInputElement): void {
    const clean = el.value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    if (el.value !== clean) el.value = clean;
    this.answers[`field_${f.fieldID}`] = clean;
    this.onChange();
  }

  // --- datetime: separate date picker + time picker, joined as "YYYY-MM-DDTHH:mm" ---
  private splitDt(fieldID: number): { date: string; time: string } {
    const [date, time] = String(this.answers[`field_${fieldID}`] ?? '').split('T');
    return { date: date ?? '', time: (time ?? '').slice(0, 5) };
  }
  dtDate(f: DynamicFormField): string { return this.splitDt(f.fieldID).date; }
  dtTime(f: DynamicFormField): string { return this.splitDt(f.fieldID).time; }
  setDtDate(f: DynamicFormField, date: string): void { this.writeDt(f.fieldID, date, this.splitDt(f.fieldID).time); }
  setDtTime(f: DynamicFormField, time: string): void { this.writeDt(f.fieldID, this.splitDt(f.fieldID).date, time); }
  private writeDt(fieldID: number, date: string, time: string): void {
    this.answers[`field_${fieldID}`] = date ? `${date}T${time || '00:00'}` : '';
    this.onChange();
  }

  isChecked(key: string, value: string): boolean {
    const v = this.answers[key];
    return Array.isArray(v) && v.includes(value);
  }
  toggleCheckbox(key: string, value: string, checked: boolean): void {
    const cur = Array.isArray(this.answers[key]) ? [...(this.answers[key] as string[])] : [];
    const i = cur.indexOf(value);
    if (checked && i < 0) cur.push(value);
    if (!checked && i >= 0) cur.splice(i, 1);
    this.answers[key] = cur;
    this.onChange();
  }

  onChange(): void {
    this.draftSaved.set(false);
    this.presenter.queueDraftSave(this.nonFileAnswers());
  }

  private nonFileAnswers(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.fields()) {
      if (isDisplayField(f.fieldType) || f.fieldType === 'file' || f.isSystemField) continue;
      const v = this.answers[`field_${f.fieldID}`];
      if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) out[`field_${f.fieldID}`] = v;
    }
    return out;
  }

  onFilePicked(f: DynamicFormField, ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (this.auth.isLoggedIn()) {
      this.presenter.stageFile(f.fieldID, file);
    } else {
      this.pendingFiles[f.fieldID] = file;
      this.stagedFiles[f.fieldID] = file.name;
    }
  }
  removeFile(f: DynamicFormField): void {
    delete this.pendingFiles[f.fieldID];
    delete this.stagedFiles[f.fieldID];
    if (this.auth.isLoggedIn()) this.presenter.removeFile(f.fieldID);
  }

  /** The fieldIDs on the section path the current answers take. */
  private reachableFieldIds(): Set<number> {
    const secs = this.sections();
    if (secs.length <= 1) return new Set(this.fields().map((f) => f.fieldID));
    const reached = reachableSectionIndexes(secs, this.answers);
    const ids = new Set<number>();
    reached.forEach((i) => secs[i].fields.forEach((f) => ids.add(f.fieldID)));
    return ids;
  }

  submit(): void {
    this.fieldErrors = {};
    const reachable = this.reachableFieldIds();
    const fd = new FormData();
    fd.append('_hp_website', this.honeypot);
    fd.append('_form_ts', String(this.form()?.formStartTs ?? this.formTs));
    for (const f of this.fields()) {
      if (isDisplayField(f.fieldType) || !reachable.has(f.fieldID)) continue;
      const key = `field_${f.fieldID}`;
      if (f.fieldType === 'file') {
        const file = this.pendingFiles[f.fieldID];
        if (file) fd.append(key, file);
        continue;
      }
      const v = this.answers[key];
      if (Array.isArray(v)) {
        for (const item of v) fd.append(key, item);
      } else if (v !== undefined && v !== null) {
        fd.append(key, String(v));
      }
    }
    this.presenter.flushDraftSave(this.nonFileAnswers());
    this.presenter.submit(fd);
  }

  refill(): void {
    this.answers = {};
    this.stagedFiles = {};
    this.pendingFiles = {};
    this.fieldErrors = {};
    this.submitResult.set(null);
    this.sectionIdx.set(0);
    this.sectionHistory = [];
    this.skippedIdx.set(new Set());
    this.descExpanded.set(false);
    this.formTs = Date.now();
    this.state.set('form');
    this.applyPrefill();
  }

  login(): void { this.redirectToLogin(`/form/${this.slug}`); }

  // --- View impl ---
  setForm(form: PublicDynamicForm): void {
    this.form.set(form);
    this.draftEnabled.set(this.auth.isLoggedIn());
    this.presenter.enableDraft(this.auth.isLoggedIn());
    this.applyPrefill();
    this.state.set('form');
  }

  private applyPrefill(): void {
    const form = this.form();
    if (!form) return;
    for (const f of form.fields) {
      const key = `field_${f.fieldID}`;
      if (f.fieldType === 'checkbox') this.answers[key] ??= [];
      else if (f.defaultValue && this.answers[key] === undefined) this.answers[key] = f.defaultValue;
    }
    const draft = form.draftAnswers ?? {};
    for (const [key, raw] of Object.entries(draft)) {
      if (raw && typeof raw === 'object' && 'fileURL' in (raw as object)) {
        const fid = Number(key.replace('field_', ''));
        this.stagedFiles[fid] = (raw as { originalFileName?: string }).originalFileName ?? 'berkas';
      } else {
        this.answers[key] = raw as string | string[];
      }
    }
    if (form.prefillEmail) {
      const sys = form.fields.find((x) => x.isSystemField && x.fieldType === 'email');
      if (sys) this.answers[`field_${sys.fieldID}`] = form.prefillEmail;
    }
  }

  remainingQuota(): number | null {
    const f = this.form();
    return f?.maxSubmission != null ? Math.max(0, f.maxSubmission - f.totalSubmission) : null;
  }

  showClosed(message: string, reason?: ClosedReason): void {
    this.closedMessage.set(message);
    this.closedReason.set(reason ?? '');
    this.state.set('closed');
  }

  redirectToLogin(returnUrl: string): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  setSubmitting(s: boolean): void { this.submitting.set(s); }

  onSubmitSuccess(result: SubmitResult): void {
    if (result.redirectUrl) { window.location.href = result.redirectUrl; return; }
    this.submitResult.set(result);
    this.state.set('done');
  }

  onValidationErrors(errors: FieldError[]): void {
    for (const e of errors) this.fieldErrors[e.attribute] = e.message;
    // Jump to the section that holds the first errored field.
    const firstId = Number((errors[0]?.attribute ?? '').replace('field_', ''));
    if (firstId && this.isMultiStep()) {
      const idx = this.sections().findIndex((s) => s.fields.some((f) => f.fieldID === firstId));
      if (idx >= 0 && idx !== this.sectionIdx()) this.goTo(idx);
    }
    this.scrollToFirstError();
  }

  onRateLimited(retryAfterSeconds: number, message: string): void {
    this.closedMessage.set('');
    this.fieldErrors['_rate'] = message;
    this.retryCountdown.set(retryAfterSeconds);
    if (this.retryTimer) clearInterval(this.retryTimer);
    this.retryTimer = setInterval(() => {
      const n = this.retryCountdown() - 1;
      this.retryCountdown.set(Math.max(0, n));
      if (n <= 0 && this.retryTimer) { clearInterval(this.retryTimer); delete this.fieldErrors['_rate']; }
    }, 1000);
  }

  onDraftFileStaged(fieldID: number, fileName: string): void { this.stagedFiles[fieldID] = fileName; }
  onDraftFileRemoved(fieldID: number): void { delete this.stagedFiles[fieldID]; }
  onDraftSaved(): void { this.draftSaved.set(true); }

  countdownText(): string {
    const s = this.retryCountdown();
    const m = Math.floor(s / 60);
    return m > 0 ? `${m} menit ${s % 60} detik` : `${s} detik`;
  }
}
