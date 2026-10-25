import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild, computed, input, model, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { ModalBackdropDirective } from './modal-backdrop.directive';
import { MultiSelectComponent, MultiSelectOption } from './multi-select.component';

export interface OrgPickerOption {
  id: number;
  name: string;
  parentName?: string;
}

export interface OrgPickerAccent {
  primary: string;
  bright: string;
  dark: string;
  soft: string;
}

/**
 * Trigger pill (sama persis gaya org-switcher-btn) + panel pilih organisasi
 * sebagai SIDEBAR kanan (bukan popup tengah) — pola tunggal dipakai di 3
 * tempat: org-switcher CmsLayoutComponent (shell LDK/Puskomda), field "LDK"
 * di form Tambah/Ubah Pengguna, dan field "LDK Tujuan" di form Pendataan
 * Kader. Klik card hanya menyorot pilihan (pending) — baru benar-benar
 * commit ke `selectedID` saat tombol confirm ditekan, sama seperti popup
 * org-switcher sebelumnya.
 *
 * Murni presentational: `options` (sudah difilter oleh pemanggil, baik
 * lewat request ulang server atau filter client-side) dan `filterOptions`
 * diberikan dari luar — komponen ini tidak tahu/peduli dari mana datanya
 * atau bagaimana cara memfilternya, hanya merender & meneruskan interaksi
 * user lewat (searchChange)/(filterSelectedChange)/selectedID.
 *
 * SEMUA input pakai signal input() (bukan @Input() decorator biasa) —
 * WAJIB, karena triggerLabel() di bawah computed() dari options()+
 * selectedID(). computed() cuma re-run kalau SIGNAL yang dibacanya berubah;
 * @Input() decorator biasa cuma reassign property polos, computed() tidak
 * pernah tahu itu berubah kecuali selectedID() KEBETULAN berubah bersamaan.
 * Itu persis bug yang dilaporkan: buka "Ubah Pengguna" untuk akun yang
 * organizationID-nya sudah terisi — options (daftar LDK) baru datang async
 * SETELAH selectedID di-set dari data user, triggerLabel() lama tidak
 * pernah re-run lagi sesudahnya sehingga trigger tetap menampilkan "Pilih
 * LDK" walau selectedID sudah benar.
 */
@Component({
  selector: 'app-org-picker',
  standalone: true,
  imports: [IconComponent, ModalBackdropDirective, MultiSelectComponent],
  template: `
    <button type="button" class="op-trigger" [class.full-width]="fullWidth()" [class.disabled]="disabled()"
            [disabled]="disabled()" (click)="openPanel()">
      <span class="op-trigger-icon"><app-icon [name]="icon()" [size]="15" /></span>
      <span class="op-trigger-text">
        <span class="op-trigger-label">{{ noun() }}</span>
        @if (loading() && !triggerLabel()) {
          <span class="skel skel-line op-trigger-skel"></span>
        } @else {
          <span class="op-trigger-value">{{ triggerLabel() ?? ('Pilih ' + noun()) }}</span>
        }
      </span>
    </button>

    <div class="op-overlay" [class.active]="panelOpen()" [class.popup]="popup()" appModalBackdrop #panelEl
         [style.--color-primary]="accent()?.primary" [style.--color-primary-bright]="accent()?.bright"
         [style.--color-primary-dark]="accent()?.dark" [style.--color-primary-soft]="accent()?.soft">
      <aside class="op-panel" [class.popup]="popup()" (click)="$event.stopPropagation()">
        <div class="op-panel-header">
          <span class="op-panel-icon"><app-icon [name]="icon()" [size]="18" /></span>
          <div class="op-panel-heading">
            <h3>{{ title() }}</h3>
            @if (subtitle()) { <p>{{ subtitle() }}</p> }
            @if (triggerLabel()) {
              <span class="op-panel-current">
                <span class="op-panel-current-label">{{ noun() }}</span>
                <span class="op-panel-current-value">{{ triggerLabel() }}</span>
              </span>
            }
          </div>
          <button type="button" class="op-panel-close" (click)="closePanel()" aria-label="Tutup">
            <app-icon name="x" [size]="16" />
          </button>
        </div>

        <div class="op-panel-body">
          <input class="form-control" type="text" [placeholder]="searchPlaceholder()" [value]="search()" (input)="onSearchInput($event)">

          @if (filterOptions().length > 0) {
            <app-multi-select [options]="filterOptions()" [selected]="filterSelected()" [searchable]="true" [placeholder]="filterPlaceholder()"
                               (selectedChange)="filterSelectedChange.emit($event)" />
          }

          <div class="op-card-list">
            @if (loading()) {
              <div class="op-loading"><app-icon name="clock" [size]="18" />Memuat {{ noun() }}…</div>
            } @else {
              @for (o of options(); track o.id) {
                <button type="button" class="op-card" [class.selected]="o.id === pendingID()" [title]="labelOf(o)" (click)="selectCard(o.id)">
                  <span class="op-card-icon"><app-icon [name]="icon()" [size]="16" /></span>
                  <span class="op-card-text">
                    <span class="op-card-name">{{ o.name }}</span>
                    @if (o.parentName) { <span class="op-card-parent">{{ o.parentName }}</span> }
                  </span>
                  @if (o.id === pendingID()) { <span class="op-card-check"><app-icon name="check" [size]="13" /></span> }
                </button>
              } @empty {
                <p class="text-muted op-empty">{{ emptyLabel() || ('Tidak ada ' + noun() + ' ditemukan.') }}</p>
              }
            }
          </div>
        </div>

        <div class="op-panel-footer">
          <button type="button" class="btn btn-outline" (click)="closePanel()">Batal</button>
          <button type="button" class="btn btn-primary" [disabled]="pendingID() == null" (click)="confirm()">{{ confirmLabel() }}</button>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    :host { display: block; }
    /* Trigger pill — identik org-switcher-btn (CmsLayoutComponent) supaya
       field LDK di form Pengguna/Pendataan terasa satu bahasa visual dengan
       org-switcher navbar, bukan dropdown native. [fullWidth] meregangkan
       jadi field form biasa (lebar penuh), default (navbar) tetap
       lebar-secukupnya. */
    .op-trigger {
      display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 12px;
      border: 1px solid var(--color-border); background: var(--color-primary-soft); color: var(--color-primary-dark);
      font-family: var(--font-body); font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), border-color var(--motion-fast) ease;
    }
    .op-trigger:hover:not(.disabled) { background: var(--color-primary); color: #fff; transform: translateY(-1px); }
    .op-trigger.disabled { cursor: not-allowed; opacity: .65; }
    .op-trigger.full-width {
      width: 100%; justify-content: flex-start; border-radius: var(--radius-xs); background: #fff; color: var(--color-text);
      padding: 11px 14px; font-weight: 600;
    }
    .op-trigger.full-width:hover:not(.disabled) { background: #fff; color: var(--color-text); border-color: var(--color-primary); transform: none; }
    .op-trigger-icon { font-size: 1rem; line-height: 1; flex-shrink: 0; }
    .op-trigger.full-width .op-trigger-icon { color: var(--color-primary); }
    .op-trigger-text { display: flex; flex-direction: column; line-height: 1.2; text-align: left; min-width: 0; flex: 1; }
    .op-trigger-label { font-size: .62rem; font-weight: 600; opacity: .8; text-transform: uppercase; letter-spacing: .03em; }
    .op-trigger.full-width .op-trigger-label { display: none; }
    .op-trigger-value { font-size: .82rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .op-trigger.full-width .op-trigger-value { font-size: .95rem; font-weight: 600; }
    .op-trigger-skel { width: 90px; height: 13px; }

    /* Dua mode presentasi lewat [popup]: default SIDEBAR (docked kanan, naik
       dari sisi kanan via translateX) dipakai org-switcher navbar;
       [popup]="true" jadi POPUP TENGAH (scale+translateY, lebih pas untuk
       field form seperti LDK di Tambah Pengguna/Pendataan Kader — konsisten
       dengan popup form lain di app ini, bukan drawer). Direparenting ke
       document.body lewat ngAfterViewInit (lihat catatan di class) supaya
       position:fixed-nya tidak terkurung containing block leluhur manapun
       (modal/form pemanggil yang mungkin punya transform), sama persis pola
       PrayerTimeComponent & org-modal-overlay sebelumnya. */
    .op-overlay {
      position: fixed; inset: 0; background: rgba(15,23,20,.5); z-index: 200;
      display: flex; align-items: stretch; justify-content: flex-end;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-base) ease, visibility var(--motion-base);
    }
    .op-overlay.popup { align-items: center; justify-content: center; padding: 16px; }
    .op-overlay.active { opacity: 1; visibility: visible; pointer-events: auto; }
    .op-panel {
      height: 100%; width: min(760px, 100vw);
      background: #fff; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; min-height: 0;
      transform: translateX(100%); transition: transform var(--motion-base) var(--ease-out);
    }
    .op-overlay.active .op-panel { transform: translateX(0); }
    .op-panel.popup {
      height: auto; width: 100%; max-width: 560px; max-height: 88vh;
      border-radius: var(--radius-lg); overflow: hidden;
      transform: scale(.9) translateY(12px);
    }
    .op-overlay.active .op-panel.popup { transform: scale(1) translateY(0); }
    @media (prefers-reduced-motion: reduce) { .op-overlay, .op-panel { transition: opacity var(--motion-base) ease, visibility var(--motion-base); transform: none !important; } }
    .op-panel-header {
      flex-shrink: 0; display: flex; align-items: flex-start; gap: 12px; padding: 22px 20px;
      background: linear-gradient(145deg, var(--color-primary-bright) 0%, var(--color-primary) 60%, var(--color-primary-dark) 100%); color: #fff;
    }
    .op-panel-icon { flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.18); border: 2px solid rgba(255,255,255,.3); display: flex; align-items: center; justify-content: center; }
    .op-panel-heading { flex: 1; min-width: 0; }
    .op-panel-heading h3 { color: #fff; font-size: 1.05rem; margin: 2px 0 2px; }
    .op-panel-heading p { font-size: .8rem; margin: 0; opacity: .85; }
    /* Chip "organisasi saat ini" — nilai yang sama dipakai op-trigger navbar
       (triggerLabel()), ditaruh di bawah judul+subjudul (bukan di samping
       tombol close — dicoba lebih dulu, dipindah ke sini) supaya tetap
       kelihatan selagi panel ini terbuka (navbar di baliknya tertutup
       overlay gelap). Rata kiri & teks penuh (tanpa ellipsis) mengikuti
       heading di atasnya, bukan dipotong seperti op-trigger navbar. */
    .op-panel-current {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 8px;
      padding: 5px 10px; border-radius: 8px;
      background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.3);
    }
    .op-panel-current-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; opacity: .8; flex-shrink: 0; }
    .op-panel-current-value { font-size: .8rem; font-weight: 800; }
    .op-panel-close { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255,255,255,.2); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .op-panel-close:hover { background: rgba(255,255,255,.35); }
    .op-panel-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 0; }
    .op-panel-body app-multi-select { flex-shrink: 0; }
    /* Sidebar (default, .op-panel LEBIH LEBAR — lihat width di atas) pakai 3
       kolom; popup (.op-panel.popup, lebih sempit, 560px) tetap 2 kolom —
       card terakhir ganjil tidak otomatis melebar, biarkan menggantung. */
    .op-card-list { display: grid; grid-template-columns: repeat(2, 1fr); align-content: start; gap: 8px; overflow-y: auto; min-height: 0; flex: 1; padding-right: 2px; }
    .op-panel:not(.popup) .op-card-list { grid-template-columns: repeat(3, 1fr); }
    .op-card-list > .op-loading, .op-card-list > .op-empty { grid-column: 1 / -1; }
    .op-loading { text-align: center; padding: 24px 0; color: var(--color-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: .88rem; }
    .op-empty { padding: 16px 0; text-align: center; font-size: .85rem; }
    .op-card {
      display: flex; align-items: center; gap: 12px; padding: 11px 14px; background: var(--color-bg-warm); border-radius: var(--radius-md);
      border: 1.5px solid transparent; cursor: pointer; text-align: left; width: 100%; min-width: 0; flex-shrink: 0; font-family: var(--font-body);
      transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease;
    }
    .op-card:hover { background: var(--color-primary-soft); }
    .op-card.selected { background: var(--color-primary-soft); border-color: var(--color-primary); }
    .op-card-icon { flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-full); background: #fff; color: var(--color-primary); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); }
    .op-card.selected .op-card-icon { background: var(--color-primary); color: #fff; box-shadow: none; }
    .op-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .op-card-name { font-weight: 700; font-size: .9rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .op-card.selected .op-card-name { color: var(--color-primary-dark); }
    .op-card-parent { font-size: .76rem; color: var(--color-muted); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .op-card-check { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; }
    .op-panel-footer { flex-shrink: 0; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--color-border); }
    .op-panel-footer .btn-primary:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
    @media (max-width: 680px) {
      .op-panel:not(.popup) .op-card-list { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .op-panel { width: 100%; }
      .op-card-list { grid-template-columns: 1fr; }
    }
  `],
})
export class OrgPickerComponent implements AfterViewInit, OnDestroy {
  options = input<OrgPickerOption[]>([]);
  loading = input(false);
  disabled = input(false);
  noun = input('Organisasi');
  icon = input('building');
  title = input('Pilih Organisasi');
  subtitle = input('');
  confirmLabel = input('Pilih');
  searchPlaceholder = input('Cari...');
  emptyLabel = input('');
  filterOptions = input<MultiSelectOption[]>([]);
  filterPlaceholder = input('Filter');
  filterSelected = input<(string | number)[]>([]);
  /** true untuk field form (lebar penuh, gaya kotak input) — false (default)
   *  untuk trigger navbar (pill lebar-secukupnya, gaya org-switcher-btn). */
  fullWidth = input(false);
  /** true = popup tengah (field form LDK di Tambah Pengguna/Pendataan Kader
   *  — konsisten dengan popup lain di app ini); false (default) = sidebar
   *  kanan (org-switcher navbar CmsLayoutComponent). */
  popup = input(false);
  accent = input<OrgPickerAccent | null>(null);

  /** Dua-arah: `[(selectedID)]` ATAU `[selectedID]` + `(selectedIDChange)`
   *  eksplisit (dipakai org-switcher CmsLayoutComponent supaya confirm
   *  memicu navigasi router, bukan langsung menimpa signal lokal). HANYA
   *  commit saat tombol confirm ditekan (lihat confirm()) — klik card cuma
   *  mengubah pendingID. */
  selectedID = model<number | null>(null);

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterSelectedChange = new EventEmitter<(string | number)[]>();
  /** Emit saat panel dibuka/ditutup — dipakai pemanggil untuk reset/reload
   *  data (mis. refresh daftar organisasi) setiap kali panel dibuka. */
  @Output() panelOpenChange = new EventEmitter<boolean>();

  panelOpen = signal(false);
  pendingID = signal<number | null>(null);
  search = signal('');

  triggerLabel = computed(() => {
    const o = this.options().find((x) => x.id === this.selectedID());
    return o ? this.labelOf(o) : null;
  });

  labelOf(o: OrgPickerOption): string {
    return o.parentName ? `${o.name} — ${o.parentName}` : o.name;
  }

  /** Dipindah ke document.body lewat ngAfterViewInit (pola sama persis
   *  PrayerTimeComponent/org-modal-overlay sebelumnya) — overlay SENGAJA
   *  tidak digerbang @if (removeChild gagal kalau node sudah dipindah ke
   *  parent lain begitu @if-nya jadi false). */
  @ViewChild('panelEl', { static: true }) private panelRef!: ElementRef<HTMLElement>;
  ngAfterViewInit(): void { document.body.appendChild(this.panelRef.nativeElement); }
  ngOnDestroy(): void { this.panelRef?.nativeElement.remove(); }

  openPanel(): void {
    if (this.disabled()) return;
    this.pendingID.set(this.selectedID());
    this.search.set('');
    this.searchChange.emit('');
    this.panelOpen.set(true);
    this.panelOpenChange.emit(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.panelOpenChange.emit(false);
  }

  onSearchInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.search.set(v);
    this.searchChange.emit(v);
  }

  selectCard(id: number): void {
    this.pendingID.set(id);
  }

  confirm(): void {
    const id = this.pendingID();
    if (id == null) return;
    this.selectedID.set(id);
    this.closePanel();
  }
}
