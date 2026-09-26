import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignLite } from '../../entities/campaign';
import { Donation, DonationAdminDetail, DonationPaymentMethod } from '../../entities/donation';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { IconComponent } from '../../../../shared/icon.component';
import { MoneyInputComponent } from '../../../../shared/money-input.component';
import { PhoneInputComponent } from '../../../../shared/phone-input.component';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalAdminDonationFormPresenter } from './kantong-amal.admin-donation-form.presenter';
import { KantongAmalAdminDonationFormView } from './kantong-amal.admin-donation-form.view';

const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'QRIS', label: 'QRIS (di luar Bisatopup)' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'BANK_TRANSFER', label: 'Transfer Bank' },
  { value: 'OTHER', label: 'Lainnya' },
];

const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'REFUNDED', label: 'Dikembalikan' },
];

interface DonationFormValue {
  campaignID: number | null;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorAge: string;
  donorDomicile: string;
  donorOccupation: string;
  isAnonymous: boolean;
  message: string;
  amount: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
}

const EMPTY_FORM: DonationFormValue = {
  campaignID: null, donorName: '', donorEmail: '', donorPhone: '', donorAge: '', donorDomicile: '', donorOccupation: '',
  isAnonymous: false, message: '', amount: null, paymentMethod: 'CASH', paymentStatus: 'PAID',
};

@Component({
  selector: 'app-kantong-amal-admin-donation-form-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-donation-form.page.html',
  imports: [RouterLink, FormsModule, SelectComponent, IconComponent, MoneyInputComponent, PhoneInputComponent],
  providers: [KantongAmalAdminDonationFormPresenter],
  styles: [`
    /* Lebar dibiarkan mengisi penuh .page-shell — lihat catatan di
       kantong-amal.campaign-form.page.ts (disamakan, bug/permintaan yang
       sama: max-width sempit ter-center di sini menyisakan ruang kosong
       besar di kanan-kiri dibanding form Berita/Artikel/dst.). */
    .page-head { margin: 0 0 24px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .toggle-row { display: flex; align-items: center; gap: 10px; }
    .anon-hint { display: flex; align-items: flex-start; gap: 6px; margin: 10px 0 0; font-size: .82rem; color: var(--color-text-secondary); background: var(--color-primary-tint); border-radius: var(--radius-sm); padding: 10px 12px; }
    .anon-hint app-icon { color: var(--color-primary); flex-shrink: 0; margin-top: 1px; }
    .readonly-note { display: flex; gap: 10px; align-items: flex-start; background: var(--color-bg-alt); border-radius: var(--radius-xs); padding: 12px 14px; font-size: .84rem; color: var(--color-text-secondary); line-height: 1.5; }
    .readonly-note app-icon { flex-shrink: 0; margin-top: 1px; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 20px; }
    @media (max-width: 480px) { .meta-grid { grid-template-columns: 1fr; } }
    .meta-item { display: flex; flex-direction: column; gap: 3px; }
    .meta-item .l { font-size: .72rem; color: var(--color-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .meta-item .v { font-size: .92rem; color: var(--color-text); font-weight: 600; overflow-wrap: anywhere; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }
  `],
})
export class KantongAmalAdminDonationFormPage implements OnInit, KantongAmalAdminDonationFormView {
  private presenter = inject(KantongAmalAdminDonationFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  editId: number | null = null;
  campaigns = signal<CampaignLite[]>([]);
  donation = signal<DonationAdminDetail | null>(null);
  loading = signal(false);
  saving = signal(false);

  form: DonationFormValue = { ...EMPTY_FORM };

  // Donasi gateway=bisatopup tidak bisa diubah/dihapus (catatan finansial
  // gateway, lihat donation_service_impl.go) — halaman ini hanya bisa dibuka
  // read-only untuknya lewat route data `viewOnly`, pola sama Berita/Formulir
  // Dinamis. Beda dari Campaign, di sini TIDAK ada aturan "readonly implisit
  // dari status" — murni ditentukan route.
  private viewOnlyRoute = false;

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  readonly paymentStatusOptions = PAYMENT_STATUS_OPTIONS;

  get campaignOptions(): SelectOption[] { return this.campaigns().map((c) => ({ value: c.campaignID, label: c.title })); }
  get isReadonly(): boolean { return this.viewOnlyRoute; }
  get pageTitle(): string {
    if (this.viewOnlyRoute) return 'Detail Donasi';
    return this.editId ? 'Ubah Donasi Manual' : 'Tambah Donasi Manual';
  }
  get isBisatopup(): boolean { return this.donation()?.gateway === 'bisatopup'; }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.viewOnlyRoute = this.route.snapshot.data['viewOnly'] === true;
    this.presenter.loadCampaigns();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.presenter.load(this.editId);
    }
  }

  /** Sama seperti campaign-form: tombol Simpan TIDAK di-disable berdasarkan
   *  ini (hanya saat saving()) — pesan spesifik dipakai supaya pengguna tahu
   *  persis field mana yang kurang, bukan tombol yang macet tanpa penjelasan
   *  (lihat revision-prompt-3.md poin 1). */
  private firstValidationError(): string | null {
    if (!this.form.campaignID) return 'Campaign wajib dipilih.';
    if (!this.form.donorName) return 'Nama donatur wajib diisi.';
    if (!this.form.amount || this.form.amount <= 0) return 'Nominal wajib diisi.';
    if (!this.form.paymentMethod) return 'Metode pembayaran wajib dipilih.';
    if (!this.form.paymentStatus) return 'Status pembayaran wajib dipilih.';
    return null;
  }

  isFormValid(): boolean {
    return this.firstValidationError() === null;
  }

  save(): void {
    const error = this.firstValidationError();
    if (error) { this.toast.error(error); return; }
    const base = {
      campaignID: this.form.campaignID!, donorName: this.form.donorName, donorEmail: this.form.donorEmail || undefined,
      donorPhone: this.form.donorPhone || undefined, donorAge: this.form.donorAge || undefined,
      donorDomicile: this.form.donorDomicile || undefined, donorOccupation: this.form.donorOccupation || undefined,
      isAnonymous: this.form.isAnonymous, message: this.form.message || undefined, amount: this.form.amount!,
      paymentMethod: this.form.paymentMethod as DonationPaymentMethod,
      paymentStatus: this.form.paymentStatus as 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED',
    };
    if (this.editId) this.presenter.update(this.editId, base);
    else this.presenter.create(base);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  setCampaigns(campaigns: CampaignLite[]): void { this.campaigns.set(campaigns); }

  setDonation(donation: DonationAdminDetail | null): void {
    this.donation.set(donation);
    if (!donation) return;
    this.form = {
      campaignID: donation.campaignID, donorName: donation.donorName, donorEmail: donation.donorEmail ?? '',
      donorPhone: donation.donorPhone ?? '', donorAge: donation.donorAge ?? '', donorDomicile: donation.donorDomicile ?? '',
      donorOccupation: donation.donorOccupation ?? '', isAnonymous: donation.isAnonymous, message: donation.message ?? '',
      // Fallback ke 'CASH' HANYA masuk akal untuk EMPTY_FORM (entri baru) —
      // untuk data yang sudah ada (khususnya donasi bisatopup yang dibuka
      // read-only), null berarti "metode tidak tercatat", bukan "Tunai".
      amount: donation.amount, paymentMethod: donation.paymentMethod ?? null, paymentStatus: donation.paymentStatus,
    };
  }

  onSaveSuccess(donation: Donation): void {
    this.toast.success('Donasi manual berhasil disimpan.');
    this.router.navigateByUrl(kantongAmalPath.adminDonations);
  }
}
