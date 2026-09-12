import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { SCHEDULE_CATEGORIES, toISODate } from '../../schedule.constants';
import { ScheduleFormPresenter, ScheduleFormValue, emptyScheduleForm } from './schedule.form.presenter';
import { ScheduleFormView } from './schedule.form.view';

@Component({
  selector: 'app-schedule-form-page',
  standalone: true,
  templateUrl: './schedule.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, SelectComponent],
  providers: [ScheduleFormPresenter],
  styles: [`
    .page-head { margin: 0 0 24px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-control-lg { font-weight: 700; }
    .allday-row { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }
  `],
})
export class ScheduleFormPage implements OnInit, ScheduleFormView {
  private presenter = inject(ScheduleFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat schedule.routes.ts), bukan
  // URL atau state terpisah, supaya layout field tidak dobel-maintain di 2 file.
  isReadonly = false;
  form: ScheduleFormValue = { ...emptyScheduleForm };

  categoryOptions = computed(() => SCHEDULE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })));

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap jadwal ini.';
    return this.editId ? 'Perbarui informasi jadwal yang sudah ada.' : 'Isi informasi jadwal yang akan tampil di kalender publik.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
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
