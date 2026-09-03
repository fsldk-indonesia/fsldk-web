import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { FieldError } from '../../../../core/entities/api-response';
import { LinkifyTextPipe } from '../../linkify-text.pipe';
import { PublicDynamicForm, SubmitResult } from '../../entities/dynamic-form';
import { DynamicFormField } from '../../entities/dynamic-form-field';
import { evalConditional, isDisplayField } from '../../dynamicform.constants';
import { DynamicFormPublicFillPresenter } from './dynamicform.public-fill.presenter';
import { DynamicFormPublicFillView } from './dynamicform.public-fill.view';

type FillState = 'loading' | 'form' | 'closed' | 'done';

@Component({
  selector: 'app-dynamicform-public-fill-page',
  standalone: true,
  templateUrl: './dynamicform.public-fill.page.html',
  imports: [FormsModule, LinkifyTextPipe],
  providers: [DynamicFormPublicFillPresenter],
  styles: [`
    .wrap { max-width: 720px; margin: 32px auto; padding: 0 16px; }
    .form-head { background: var(--color-primary, #00933b); color: #fff; border-radius: 14px 14px 0 0; padding: 26px 28px; }
    .form-head h1 { margin: 0 0 6px; font-size: 1.5rem; }
    .card { background: #fff; border: 1px solid var(--color-border); border-radius: 12px; padding: 20px 22px; margin-bottom: 12px; }
    .card:first-of-type { border-radius: 0 0 12px 12px; }
    label.q { display: block; font-weight: 600; margin-bottom: 6px; }
    .req { color: #b42318; }
    .help { color: var(--color-text-secondary); font-size: .85rem; margin: 2px 0 8px; }
    .opt { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-weight: 400; }
    .err { color: #b42318; font-size: .82rem; margin-top: 4px; }
    .hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
    .section-break { border-top: 2px solid var(--color-border); padding-top: 16px; margin-top: 4px; }
    .section-break h3 { margin: 0; }
    .staged { color: #00712e; font-size: .82rem; }
    .banner { background: #fff3d6; color: #92600a; border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; }
    .done-card, .closed-card { background: #fff; border: 1px solid var(--color-border); border-radius: 14px; padding: 40px 28px; text-align: center; }
    .stars { font-size: 1.5rem; cursor: pointer; user-select: none; }
    .scale { display: flex; gap: 10px; flex-wrap: wrap; }
  `],
})
export class DynamicFormPublicFillPage implements OnInit, OnDestroy, DynamicFormPublicFillView {
  private presenter = inject(DynamicFormPublicFillPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthRepository);

  state = signal<FillState>('loading');
  form = signal<PublicDynamicForm | null>(null);
  closedMessage = signal('');
  submitting = signal(false);
  submitResult = signal<SubmitResult | null>(null);
  retryCountdown = signal(0);
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  /** answers keyed "field_<id>": string, or string[] for checkbox. */
  answers: Record<string, string | string[]> = {};
  fieldErrors: Record<string, string> = {};
  stagedFiles: Record<number, string> = {};
  pendingFiles: Record<number, File> = {};
  private formTs = Date.now();
  honeypot = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.init(this.route.snapshot.paramMap.get('slug') ?? '');
  }

  ngOnDestroy(): void {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  isDisplay = isDisplayField;
  visible(f: DynamicFormField): boolean { return evalConditional(f, this.answers); }
  isSystemEmail(f: DynamicFormField): boolean { return f.isSystemField && f.fieldType === 'email'; }

  fields(): DynamicFormField[] {
    return (this.form()?.fields ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }

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

  submit(): void {
    this.fieldErrors = {};
    const fd = new FormData();
    fd.append('_hp_website', this.honeypot);
    fd.append('_form_ts', String(this.formTs));
    for (const f of this.fields()) {
      if (isDisplayField(f.fieldType)) continue;
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
    this.submitResult.set(null);
    this.formTs = Date.now();
    this.state.set('form');
    this.applyPrefill();
  }

  // --- View impl ---
  setForm(form: PublicDynamicForm): void {
    this.form.set(form);
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

  showClosed(message: string): void { this.closedMessage.set(message); this.state.set('closed'); }

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

  countdownText(): string {
    const s = this.retryCountdown();
    const m = Math.floor(s / 60);
    return m > 0 ? `${m} menit ${s % 60} detik` : `${s} detik`;
  }
}
