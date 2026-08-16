import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { EventFormPresenter, EventFormValue, emptyEventForm } from './event.form.presenter';
import { EventFormView } from './event.form.view';

@Component({
  selector: 'app-event-form-page',
  standalone: true,
  templateUrl: './event.form.page.html',
  imports: [FormsModule, RouterLink, ImageUploadComponent, RichTextEditorComponent, DateTimePickerComponent],
  providers: [EventFormPresenter],
  styles: [`
    .page-head { max-width: 900px; margin: 0 auto 24px; }
    .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 900px; margin: 0 auto; }
    .section-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--color-muted); margin: 28px 0 14px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }
  `],
})
export class EventFormPage implements OnInit, EventFormView {
  private presenter = inject(EventFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  editId: number | null = null;
  form: EventFormValue = { ...emptyEventForm };

  ngOnInit(): void {
    this.presenter.attachView(this);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.editId = +id; this.presenter.loadForEdit(this.editId); }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setForm(form: EventFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/events']); }
}
