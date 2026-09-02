import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SelectComponent } from '../../../../shared/select.component';
import { SCHEDULE_CATEGORIES, toISODate } from '../../schedule.constants';
import { ScheduleFormPresenter, ScheduleFormValue, emptyScheduleForm } from './schedule.form.presenter';
import { ScheduleFormView } from './schedule.form.view';

@Component({
  selector: 'app-schedule-form-page',
  standalone: true,
  templateUrl: './schedule.form.page.html',
  imports: [FormsModule, RouterLink, SelectComponent],
  providers: [ScheduleFormPresenter],
  styles: [`
    .page-head { max-width: 820px; margin: 0 auto 24px; }
    .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; margin: 0 auto 20px; }
    .form-card + .form-card { margin-top: -4px; }
    .fieldset-title { font-size: .95rem; font-weight: 700; margin: 0 0 14px; color: var(--color-text-secondary); }
    .allday-row { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; }
  `],
})
export class ScheduleFormPage implements OnInit, ScheduleFormView {
  private presenter = inject(ScheduleFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  editId: number | null = null;
  form: ScheduleFormValue = { ...emptyScheduleForm };

  categoryOptions = computed(() => SCHEDULE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })));

  ngOnInit(): void {
    this.presenter.attachView(this);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    } else {
      this.form.startDate = toISODate(new Date());
    }
  }

  onAllDayChange(): void {
    if (this.form.isAllDay) { this.form.startTime = ''; this.form.endTime = ''; }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setForm(form: ScheduleFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/schedules']); }
}
