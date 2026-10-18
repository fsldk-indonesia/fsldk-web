import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../../core/services/alert.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
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

/** Config CmsIndexConfig<PengurusEntry> — pola sama dengan
 *  buildUserIndexConfig di user.index.page.ts, dibuat lewat factory karena
 *  target pencarian "Role" butuh loadOptions yang menunjuk ke presenter
 *  instance (dan katalog role ter-scope tier, lihat roleOptions). */
function buildPengurusIndexConfig(presenter: PengurusIndexPresenter, roleOptions: SelectOption[]): CmsIndexConfig<PengurusEntry> {
  return {
    entityLabel: 'pengurus',
    searchTargets: [
      { value: 'name', label: 'Nama' },
      { value: 'email', label: 'Email' },
      { value: 'organization', label: 'LDK Asal' },
      { value: 'role', label: 'Role', mode: 'combobox', loadOptions: () => presenter.roleSearchOptions(roleOptions) },
    ],
    columns: [
      { key: 'fullName', label: 'Nama', locked: true },
      { key: 'email', label: 'Email' },
      { key: 'homeOrganizationName', label: 'LDK Asal' },
      { key: 'roleName', label: 'Role Saat Ini' },
    ],
    defaultSort: { sortBy: 'fullName', sortDir: 'asc' },
    rowIdKey: 'userID',
    emptyIcon: 'id-card',
    emptyTitle: 'Belum ada kader aktif',
    emptyDescription: 'Kader aktif di organisasi Anda akan muncul di sini.',
  };
}

@Component({
  selector: 'app-pengurus-index-page',
  standalone: true,
  templateUrl: './pengurus.index.page.html',
  imports: [FormsModule, SelectComponent, CmsIndexComponent],
  providers: [PengurusIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .role-cell { max-width: 220px; }
  `],
})
export class PengurusIndexPage implements OnInit, PengurusIndexView {
  private presenter = inject(PengurusIndexPresenter);
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);
  private orgContext = inject(OrgContextService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<PengurusEntry>;

  busyUserID = signal<number | null>(null);
  /** Dibump setiap kali onRoleChange() berjalan (confirm ATAU cancel) — dipakai
   *  sebagai track key micro-@for yang membungkus <app-select> di template
   *  (BUKAN @for luar — itu milik CmsIndexComponent sendiri, di-track lewat
   *  config.rowIdKey/userID, di luar kendali halaman ini sejak rework ke
   *  app-cms-index). Membungkus ulang dengan @for lokal ber-track resyncTick
   *  memaksa <app-select> remount tiap kali tick berubah, supaya ia membaca
   *  ulang [ngModel] dari item.roleName. Perlu: SelectComponent.choose()
   *  langsung menyetel state internalnya SEBELUM dialog konfirmasi tampil
   *  (lihat select.component.ts), jadi kalau user membatalkan, dropdown akan
   *  tetap menampilkan pilihan yang dibatalkan itu kecuali dipaksa resync. */
  resyncTick = signal(0);

  /** organizationID hasil org-switcher (query param ?organizationID=, lihat
   *  OrgContextService) — diteruskan ke setiap pemanggilan GET /pengurus
   *  supaya tabel benar-benar berubah saat switcher diganti, bukan selalu
   *  menampilkan cakupan penuh caller. undefined = pakai cakupan penuh
   *  caller sendiri (switcher belum/tidak dipakai). */
  private currentOrganizationID: number | undefined;

  roleOptions: SelectOption[] = PENGURUS_ROLES_BY_TIER[(this.route.snapshot.data['tier'] as string) ?? 'LDK'] ?? [];

  readonly config = buildPengurusIndexConfig(this.presenter, this.roleOptions);
  dataSource = (params: CmsListParams) => this.presenter.list(params, this.currentOrganizationID);

  ngOnInit(): void {
    this.presenter.attachView(this);
    // Tidak memanggil presenter.loadAll() di sini — <app-cms-index> memicu
    // pengambilan data awalnya sendiri lewat dataSource begitu ia init.
    this.orgContext.organizationID$(this.route).subscribe((organizationID) => {
      const changed = this.currentOrganizationID !== organizationID;
      this.currentOrganizationID = organizationID;
      // Lewati refresh pertama (table belum ter-render saat subscribe()
      // langsung emit synchronous) — dataSource awal <app-cms-index> sendiri
      // sudah membaca currentOrganizationID yang benar lewat closure di atas.
      if (changed && this.table) this.table.refresh();
    });
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
    this.presenter.updateRole(item.userID, roleName, () => this.table.refresh());
  }

  /** setItems/setLoading ada di kontrak PengurusIndexView (dipakai
   *  presenter.loadAll(), masih dipanggil dari dalam updateRole() untuk
   *  alasan historis) tapi halaman ini tidak lagi merender dari items()/
   *  loading() — <app-cms-index> yang mengelola data & state loading-nya
   *  sendiri lewat dataSource. Sengaja no-op, bukan dihapus dari interface,
   *  supaya presenter (sudah diuji di pengurus.index.presenter.spec.ts)
   *  tidak perlu diubah. */
  setItems(): void {}
  setLoading(): void {}
  setBusy(userID: number | null): void { this.busyUserID.set(userID); }
}
