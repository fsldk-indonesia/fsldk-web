import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { MoneyInputComponent } from '../../../../shared/money-input.component';
import { Setting } from '../../entities/setting';
import { SettingIndexPresenter } from './setting.index.presenter';
import { SettingIndexView } from './setting.index.view';

interface SettingGroup {
  name: string;
  items: Setting[];
}

// settingKey yang nilainya boolean ("true"/"false") — dirender sebagai
// dropdown Ya/Tidak alih-alih text input bebas. Cuma 1 use-case saat ini
// (lihat revision-prompt-4.md item 4), jadi di-special-case per key di sini
// alih-alih bikin kolom settingType generik di skema untuk satu kasus.
const BOOLEAN_SETTING_KEYS = new Set(['whatsapp_enabled']);

// settingKey yang nilainya tanggal ("YYYY-MM-DD") — dirender sebagai
// app-datetime-picker (showTime=false, popup kalender) alih-alih text input
// bebas. Sama alasannya dengan BOOLEAN_SETTING_KEYS: special-case per key,
// bukan kolom settingType generik untuk satu kasus (4 deadline operasional,
// lihat migrations/0048_setting_deadline.up.sql & dashboard_dto.DeadlineAlert).
const DATE_SETTING_KEYS = new Set([
  'whatsapp_integration', 'hosting_server', 'rent_domain', 'certificate_website',
]);

// Ikon + varian icon-badge per settingGroup (lihat migrations 0008/0019/0029/0032/0048) —
// murni kosmetik, tidak ada makna bisnis di baliknya. Grup yang belum dikenal
// (mis. settingGroup baru di masa depan) jatuh ke fallback 'settings'/neutral.
const GROUP_META: Record<string, { icon: string; variant: string }> = {
  format_keuangan: { icon: 'file-spreadsheet', variant: 'soft' },
  layanan: { icon: 'wrench', variant: 'info' },
  notifikasi: { icon: 'message-circle', variant: 'gold' },
  kantong_amal: { icon: 'hand-heart', variant: 'ember' },
  kontak: { icon: 'mail', variant: 'solid' },
  deadline: { icon: 'calendar-days', variant: 'danger' },
};
const GROUP_LABELS: Record<string, string> = {
  format_keuangan: 'Format Keuangan',
  layanan: 'Layanan',
  notifikasi: 'Notifikasi',
  kantong_amal: 'Kantong Amal',
  kontak: 'Kontak',
  deadline: 'Deadline Operasional',
};

@Component({
  selector: 'app-setting-index-page',
  standalone: true,
  templateUrl: './setting.index.page.html',
  imports: [FormsModule, SelectComponent, DateTimePickerComponent, MoneyInputComponent, IconComponent],
  providers: [SettingIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .settings-list { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 4px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .group-card > .card-pad { padding-top: 20px; }
    .setting-row { padding: 16px 0; border-bottom: 1px solid var(--color-border); }
    .setting-row:last-child { padding-bottom: 4px; border-bottom: none; }
    .setting-row .form-label { margin-bottom: 8px; }
    .field-input-row { display: flex; align-items: center; gap: 12px; }
    .field-input-row .form-control, .field-input-row p, .field-input-row app-select,
    .field-input-row app-datetime-picker, .field-input-row app-money-input { flex: 1; min-width: 0; margin: 0; }
  `],
})
export class SettingIndexPage implements OnInit, SettingIndexView {
  private presenter = inject(SettingIndexPresenter);
  private auth = inject(AuthRepository);

  settings = signal<Setting[]>([]);
  loading = signal(true);
  busy = signal<ReadonlySet<number>>(new Set());

  canUpdate = this.auth.hasPermission('setting.update');

  readonly yesNoOptions: SelectOption[] = [
    { value: 'true', label: 'Ya' },
    { value: 'false', label: 'Tidak' },
  ];

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  isBoolean(s: Setting): boolean { return BOOLEAN_SETTING_KEYS.has(s.settingKey); }
  isDate(s: Setting): boolean { return DATE_SETTING_KEYS.has(s.settingKey); }

  // app-money-input bekerja di ruang `number` (lihat money-input.component.ts),
  // sedangkan Setting.settingValue2 disimpan sebagai string biasa (sama
  // seperti settingValue) — dua method ini jembatani konversinya.
  moneyValue(s: Setting): number { return s.settingValue2 ? Number(s.settingValue2) : 0; }
  setMoneyValue(s: Setting, amount: number): void { s.settingValue2 = amount ? String(amount) : ''; }

  groupIcon(name: string): string { return GROUP_META[name]?.icon ?? 'settings'; }
  groupVariant(name: string): string { return GROUP_META[name]?.variant ?? 'neutral'; }
  groupLabel(name: string): string { return GROUP_LABELS[name] ?? name; }

  groups(): SettingGroup[] {
    const map = new Map<string, Setting[]>();
    for (const s of this.settings()) {
      const list = map.get(s.settingGroup) ?? [];
      list.push(s);
      map.set(s.settingGroup, list);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  save(s: Setting): void {
    this.setBusy(s.settingID);
    this.presenter.save(s.settingID, s.settingValue, s.settingValue2);
  }

  setSettings(items: Setting[]): void { this.settings.set(items); this.loading.set(false); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
