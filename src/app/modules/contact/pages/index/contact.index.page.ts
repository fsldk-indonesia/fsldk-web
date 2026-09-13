import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { ContactDetail, ContactListItem } from '../../entities/contact';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ContactIndexPresenter } from './contact.index.presenter';
import { ContactIndexView } from './contact.index.view';

/** Config CmsIndexConfig<ContactListItem> — lihat CmsIndexComponent untuk
 *  kontrak lengkapnya, pola sama seperti Berita. Pesan datang dari
 *  pengunjung (form Hubungi Kami publik), bukan dibuat lewat CMS — tanpa
 *  createRoute/createLabel, sama seperti Komentar. */
function buildContactIndexConfig(): CmsIndexConfig<ContactListItem> {
  return {
    entityLabel: 'pesan',
    guideCards: [
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari nama pengirim, email, atau subjek lewat satu kotak pencarian, pilih status baca, atau atur rentang tanggal — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat & Balas', description: 'Klik baris mana pun untuk membaca pesan lengkap (otomatis ditandai sudah dibaca) dan membalasnya lewat email resmi.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu pesan lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'unread', label: 'Belum Dibaca' },
      { value: 'read', label: 'Sudah Dibaca' },
    ],
    searchTargets: [
      { value: 'search', label: 'Nama / Email / Subjek' },
    ],
    showDateRange: true,
    columns: [
      { key: 'senderName', label: 'Pengirim', locked: true },
      { key: 'subject', label: 'Subjek' },
      { key: 'isRead', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Waktu Kirim' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'messageID',
    emptyIcon: 'inbox',
    emptyTitle: 'Belum ada pesan kontak',
    emptyDescription: 'Pesan dari pengunjung lewat form Hubungi Kami akan muncul di sini.',
  };
}

type ViewMode = 'detail' | 'reply';

@Component({
  selector: 'app-contact-index-page',
  standalone: true,
  templateUrl: './contact.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent],
  providers: [ContactIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama persis seperti popup Pengguna. */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    /* Buka/tutup modal digerakkan lewat Web Animations API (lihat
       animateModal()), bukan CSS transition — pola & alasan sama persis
       seperti popup Pengguna (lihat catatan panjang di sana). */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 560px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    .modal-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 18px;
      border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; padding-top: 18px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    .modal-footer.footer-between { justify-content: space-between; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .field-card .form-section-label { margin: 0; }

    .sender-name { font-size: .92rem; }
    .sender-email { margin-top: 2px; }
    .chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: var(--radius-full); font-size: .76rem; font-weight: 700; letter-spacing: .02em; }
    .chip-green { background: #dcfce7; color: #15803d; }
    .chip-gray { background: var(--color-bg-alt); color: var(--color-text-secondary); }
    .reply-original-box { background: var(--color-bg-alt); border: 1px dashed var(--color-border); border-radius: var(--radius-xs); padding: 10px 14px; }
    .info-box { display: flex; gap: 10px; align-items: flex-start; background: var(--color-primary-soft); color: var(--color-primary-dark); border-radius: var(--radius-xs); padding: 12px 14px; font-size: .84rem; line-height: 1.5; }
    .info-box app-icon { flex-shrink: 0; margin-top: 1px; }
  `],
})
export class ContactIndexPage implements OnInit, ContactIndexView {
  private presenter = inject(ContactIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<ContactListItem>;
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  busy = signal<ReadonlySet<number>>(new Set());
  showForm = signal(false);
  sending = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  selectedMessage = signal<ContactDetail | null>(null);
  viewMode: ViewMode = 'detail';

  replySubjectText = signal('');
  replyBodyText = signal('');

  canDelete = this.auth.hasPermission('contact.delete');

  readonly config = buildContactIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  get modalTitle(): string {
    return this.viewMode === 'reply' ? 'Balas Pesan via Email' : 'Detail Pesan Kontak';
  }
  get modalSubtitle(): string {
    return this.viewMode === 'reply'
      ? 'Tulis balasan resmi — akan dikirim otomatis dari alamat noreply sistem.'
      : 'Pesan otomatis ditandai sudah dibaca setelah dibuka.';
  }

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  openView(item: ContactListItem): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.viewMode = 'detail';
    this.selectedMessage.set(null);
    this.showForm.set(true);
    this.animateModal(true);
    this.presenter.loadDetail(item.messageID);
  }

  close(): void {
    if (this.sending()) return;
    this.animateModal(false);
    this.showForm.set(false);
  }

  openReply(): void {
    const msg = this.selectedMessage();
    if (!msg) return;
    const subj = msg.subject || '';
    this.replySubjectText.set(subj.toLowerCase().startsWith('re:') ? subj : 'Re: ' + subj);
    this.replyBodyText.set('');
    this.viewMode = 'reply';
  }

  backToDetail(): void {
    if (this.sending()) return;
    this.viewMode = 'detail';
  }

  async submitReply(): Promise<void> {
    const msg = this.selectedMessage();
    const subject = this.replySubjectText().trim();
    const message = this.replyBodyText().trim();
    if (!msg || !subject || !message) return;

    const ok = await this.alert.confirm(
      `Kirim balasan email ini ke ${msg.senderName} (${msg.email})?`,
      { title: 'Konfirmasi Kirim Balasan', confirmLabel: 'Ya, Kirim Sekarang' },
    );
    if (!ok) return;

    this.presenter.sendReply(msg.messageID, msg.email, { subject, message });
  }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  sama persis seperti popup Pengguna (lihat catatan panjang di sana). */
  private animateModal(opening: boolean): void {
    const el = this.modalEl?.nativeElement;
    if (!el) return;
    this.modalAnimation?.cancel();
    const { dx, dy } = this.popupOrigin();
    const closed: Keyframe = { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.25)` };
    const open: Keyframe = { opacity: 1, transform: 'none' };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const anim = el.animate(opening ? [closed, open] : [open, closed], {
      duration: reduceMotion ? 1 : 250,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'forwards',
    });
    this.modalAnimation = anim;
    anim.onfinish = () => {
      anim.cancel();
      if (this.modalAnimation === anim) this.modalAnimation = null;
    };
  }

  async remove(item: ContactListItem, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus pesan dari "${item.senderName}" dengan subjek "${item.subject}"?`, {
      title: 'Hapus Pesan Kontak', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(item.messageID);
    this.presenter.remove(item.messageID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  // ContactIndexView
  setDetail(detail: ContactDetail): void { this.selectedMessage.set(detail); this.table.refresh(); }
  setSending(sending: boolean): void { this.sending.set(sending); }
  onReplySuccess(): void { this.showForm.set(false); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
