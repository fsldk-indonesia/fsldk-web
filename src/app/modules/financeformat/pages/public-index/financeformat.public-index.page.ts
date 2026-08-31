import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/icon.component';
import { ToastService } from '../../../../core/services/toast.service';
import { FinanceFormat } from '../../entities/finance-format';
import { FinanceFormatType } from '../../entities/finance-format-type';
import { FinanceFormatPublicList } from '../../entities/finance-format-public';
import { FinanceFormatPublicIndexPresenter } from './financeformat.public-index.presenter';
import { FinanceFormatPublicIndexView } from './financeformat.public-index.view';

/** One category card's data: the fixed type plus its active files (may be empty). */
interface FormatGroup {
  type: FinanceFormatType;
  files: FinanceFormat[];
}

@Component({
  selector: 'app-financeformat-public-index-page',
  standalone: true,
  templateUrl: './financeformat.public-index.page.html',
  imports: [DatePipe, IconComponent],
  providers: [FinanceFormatPublicIndexPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .fmt-card { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
    .fmt-head { display: flex; align-items: flex-start; gap: 12px; padding: 18px; border-bottom: 1px solid var(--color-border); }
    .fmt-head h3 { margin: 0; font-size: 1rem; line-height: 1.35; }
    .fmt-head .count { margin-left: auto; flex-shrink: 0; }
    .fmt-files { list-style: none; margin: 0; padding: 8px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .fmt-file { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-bg-warm); }
    .fmt-file-info { min-width: 0; flex: 1; }
    .fmt-file-info .name { display: block; font-weight: 600; font-size: .9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fmt-file-info .date { color: var(--color-muted); font-size: .78rem; }
    .fmt-file-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .fmt-empty { padding: 18px; color: var(--color-muted); font-size: .85rem; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center; }
    .cp-card { margin-top: 32px; display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: var(--color-primary-soft); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    .cp-card .cp-text { flex: 1; } .cp-card h4 { margin: 0 0 2px; } .cp-card p { margin: 0; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class FinanceFormatPublicIndexPage implements OnInit, FinanceFormatPublicIndexView {
  private presenter = inject(FinanceFormatPublicIndexPresenter);
  private toast = inject(ToastService);

  loading = signal(true);
  private formatTypes = signal<FinanceFormatType[]>([]);
  private formats = signal<FinanceFormat[]>([]);
  cpName = signal('');
  cpPhone = signal('');

  // 9 category cards, ordered by the backend's sortOrder, each with its own
  // active files grouped client-side from the single flat `formats` list.
  groups = computed<FormatGroup[]>(() => {
    const byType = new Map<number, FinanceFormat[]>();
    for (const f of this.formats()) {
      const list = byType.get(f.formatTypeID) ?? [];
      list.push(f);
      byType.set(f.formatTypeID, list);
    }
    return this.formatTypes().map((type) => ({ type, files: byType.get(type.formatTypeID) ?? [] }));
  });

  totalFiles = computed(() => this.formats().length);
  // wa.me needs digits only; an empty phone hides the contact card entirely.
  whatsappLink = computed(() => `https://wa.me/${this.cpPhone().replace(/\D/g, '')}`);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  // Download link points at the backend, which serves the file with a
  // Content-Disposition name = kebab-case of the user's fileName + .xlsx. The
  // trailing segment is decorative so a copied link is readable too.
  downloadUrl(f: FinanceFormat): string {
    return `${environment.apiBaseUrl}/public/finance-formats/${f.financeFormatID}/download/${this.slugName(f.fileName)}.xlsx`;
  }

  copy(url: string): void {
    navigator.clipboard.writeText(url).then(
      () => this.toast.success('Tautan disalin'),
      () => this.toast.error('Gagal menyalin tautan'),
    );
  }

  // Mirror of base/slug.Make on the backend: lowercase, non-alphanumeric runs
  // become a single hyphen, trimmed. The stored fileName is never touched.
  private slugName(name: string): string {
    const s = name.trim().toLowerCase()
      .replace(/\.xlsx$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return s || 'item';
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setData(data: FinanceFormatPublicList): void {
    this.formatTypes.set(data.formatTypes);
    this.formats.set(data.formats);
    this.cpName.set(data.cpName ?? '');
    this.cpPhone.set(data.cpPhone ?? '');
  }
}
