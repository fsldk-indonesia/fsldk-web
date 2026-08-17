import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { IconComponent } from '../../../../shared/icon.component';
import { SubmissionForm } from '../../entities/submission-form';
import { submissionFormPath } from '../../submission-form.path';
import { FormFormValue, SubmissionFormIndexPresenter } from './submission-form.index.presenter';
import { SubmissionFormIndexView } from './submission-form.index.view';

@Component({
  selector: 'app-submission-form-index-page',
  standalone: true,
  templateUrl: './submission-form.index.page.html',
  imports: [FormsModule, IconComponent],
  providers: [SubmissionFormIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; max-height: 86vh; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .grid-2 > .card { display: flex; flex-direction: column; }
    .card-footer { margin-top: auto; padding-top: 16px; }
  `],
})
export class SubmissionFormIndexPage implements OnInit, SubmissionFormIndexView {
  private presenter = inject(SubmissionFormIndexPresenter);
  private auth = inject(AuthRepository);
  private router = inject(Router);

  forms = signal<SubmissionForm[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  form: FormFormValue = { formCode: '', formName: '', description: '' };
  canManage = this.auth.hasPermission('submission_form.manage');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.loading.set(true);
    this.presenter.loadForms();
  }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.form = { formCode: '', formName: '', description: '' };
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }
  save(): void { this.presenter.save(this.form); }

  open(f: SubmissionForm): void { this.router.navigateByUrl(submissionFormPath.builder(f.formID)); }

  setForms(forms: SubmissionForm[]): void { this.forms.set(forms); this.loading.set(false); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.loading.set(true); this.presenter.loadForms(); }
}
