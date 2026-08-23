import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { Setting } from '../../entities/setting';
import { SettingIndexPresenter } from './setting.index.presenter';
import { SettingIndexView } from './setting.index.view';

interface SettingGroup {
  name: string;
  items: Setting[];
}

@Component({
  selector: 'app-setting-index-page',
  standalone: true,
  templateUrl: './setting.index.page.html',
  imports: [FormsModule],
  providers: [SettingIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .group-card { margin-bottom: 20px; }
    .group-title { font-size: .8rem; font-weight: 700; color: var(--color-text-secondary); margin: 0 0 12px; text-transform: uppercase; letter-spacing: .04em; }
    .setting-row { padding: 14px 0; border-bottom: 1px solid var(--color-border); }
    .setting-row:last-child { border-bottom: none; }
    .field-input-row { display: flex; align-items: center; gap: 12px; }
    .field-input-row .form-control, .field-input-row p { flex: 1; margin: 0; }
  `],
})
export class SettingIndexPage implements OnInit, SettingIndexView {
  private presenter = inject(SettingIndexPresenter);
  private auth = inject(AuthRepository);

  settings = signal<Setting[]>([]);
  loading = signal(true);
  busy = signal<ReadonlySet<number>>(new Set());

  canUpdate = this.auth.hasPermission('setting.update');

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

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
    this.presenter.save(s.settingID, s.settingValue);
  }

  setSettings(items: Setting[]): void { this.settings.set(items); this.loading.set(false); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
