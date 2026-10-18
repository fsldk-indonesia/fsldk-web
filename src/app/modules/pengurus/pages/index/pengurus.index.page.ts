import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { IconComponent } from '../../../../shared/icon.component';
import { PengurusEntry } from '../../entities/pengurus';
import { PengurusIndexPresenter } from './pengurus.index.presenter';
import { PengurusIndexView } from './pengurus.index.view';

/** Katalog role per tier — HARUS ikut diubah di backend
 *  (submission_service_impl.go pengurusRolesByTier) bila daftar ini
 *  berubah, pola sama dengan WILDCARD_TIERS/TIER_REQUIRED_ROLE di
 *  user.index.page.ts. Enforcement sesungguhnya tetap di backend — daftar
 *  ini murni supaya dropdown tidak menampilkan opsi yang pasti ditolak
 *  server. */
const PENGURUS_ROLES_BY_TIER: Record<string, SelectOption[]> = {
  LDK: [
    { value: 'Kader', label: 'Kader' },
    { value: 'LDK Admin', label: 'LDK Admin' },
  ],
  PUSKOMDA: [
    { value: 'Kader', label: 'Kader' },
    { value: 'LDK Admin', label: 'LDK Admin' },
    { value: 'Puskomda Verifikator', label: 'Puskomda Verifikator' },
  ],
  PUSKOMNAS: [
    { value: 'Kader', label: 'Kader' },
    { value: 'LDK Admin', label: 'LDK Admin' },
    { value: 'Puskomda Verifikator', label: 'Puskomda Verifikator' },
    { value: 'Puskomnas Verifikator', label: 'Puskomnas Verifikator' },
  ],
};

@Component({
  selector: 'app-pengurus-index-page',
  standalone: true,
  templateUrl: './pengurus.index.page.html',
  imports: [FormsModule, SelectComponent, IconComponent],
  providers: [PengurusIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .pengurus-table { width: 100%; border-collapse: collapse; }
    .pengurus-table th { text-align: left; padding: 10px 12px; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); border-bottom: 1px solid var(--color-border); }
    .pengurus-table td { padding: 10px 12px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .role-cell { max-width: 220px; }
    .empty-state-inline { padding: 36px 20px 24px; }
  `],
})
export class PengurusIndexPage implements OnInit, PengurusIndexView {
  private presenter = inject(PengurusIndexPresenter);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  items = signal<PengurusEntry[]>([]);
  loading = signal(true);
  busyUserID = signal<number | null>(null);
  /** Dibump setiap kali onRoleChange() berjalan (confirm ATAU cancel) —
   *  dipakai sebagai bagian dari @for's track supaya app-select tiap baris
   *  dipaksa remount dan membaca ulang [ngModel] dari item.roleName.
   *  Perlu: SelectComponent.choose() langsung menyetel state internalnya
   *  SEBELUM konfirmasi dialog ditampilkan (lihat select.component.ts),
   *  jadi kalau pengguna membatalkan konfirmasi, dropdown akan tetap
   *  menampilkan pilihan yang dibatalkan itu kecuali kita paksa resync. */
  resyncTick = signal(0);

  roleOptions: SelectOption[] = PENGURUS_ROLES_BY_TIER[(this.route.snapshot.data['tier'] as string) ?? 'LDK'] ?? [];

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadAll();
  }

  rowKey(item: PengurusEntry): string {
    return `${item.userID}_${this.resyncTick()}`;
  }

  async onRoleChange(item: PengurusEntry, newRole: unknown, event?: Event): Promise<void> {
    const roleName = newRole as string;
    if (roleName === item.roleName) return;
    const ok = await this.alert.confirm(
      `Ubah role "${item.fullName}" dari ${item.roleName} menjadi ${roleName}?`,
      { title: 'Ubah Role Pengurus', confirmLabel: 'Ya, Ubah' }, event,
    );
    this.resyncTick.update((n) => n + 1);
    if (!ok) return;
    this.presenter.updateRole(item.userID, roleName);
  }

  setItems(items: PengurusEntry[]): void { this.items.set(items); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(userID: number | null): void { this.busyUserID.set(userID); }
}
