import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignLite } from '../../entities/campaign';
import { Donation, DonationAdminDetail, DonationPaymentMethod } from '../../entities/donation';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { IconComponent } from '../../../../shared/icon.component';
import { ToastService } from '../../../../core/services/toast.service';
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
  imports: [RouterLink, FormsModule, SelectComponent, IconComponent],
  providers: [KantongAmalAdminDonationFormPresenter],
  styles: [`
    .page-head { max-width: 640px; margin: 0 auto 24px; }
    .form-card { max-width: 640px; margin: 0 auto; }
    .toggle-row { display: flex; align-items: center; gap: 10px; }
    .anon-hint { display: flex; align-items: flex-start; gap: 6px; margin: 10px 0 0; font-size: .82rem; color: var(--color-text-secondary); background: var(--color-primary-tint); border-radius: var(--radius-sm); padding: 10px 12px; }
    .anon-hint app-icon { color: var(--color-primary); flex-shrink: 0; margin-top: 1px; }
  `],
})
export class KantongAmalAdminDonationFormPage implements OnInit, KantongAmalAdminDonationFormView {
  private presenter = inject(KantongAmalAdminDonationFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  editId: number | null = null;
  campaigns = signal<CampaignLite[]>([]);
  loading = signal(false);
  saving = signal(false);

  form: DonationFormValue = { ...EMPTY_FORM };

  readonly kantongAmalPath = kantongAmalPath;
  readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  readonly paymentStatusOptions = PAYMENT_STATUS_OPTIONS;

  get campaignOptions(): SelectOption[] { return this.campaigns().map((c) => ({ value: c.campaignID, label: c.title })); }

  ngOnInit(): void {
    this.presenter.attachView(this);
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
    if (!donation) return;
    this.form = {
      campaignID: donation.campaignID, donorName: donation.donorName, donorEmail: donation.donorEmail ?? '',
      donorPhone: donation.donorPhone ?? '', donorAge: donation.donorAge ?? '', donorDomicile: donation.donorDomicile ?? '',
      donorOccupation: donation.donorOccupation ?? '', isAnonymous: donation.isAnonymous, message: donation.message ?? '',
      amount: donation.amount, paymentMethod: donation.paymentMethod ?? 'CASH', paymentStatus: donation.paymentStatus,
    };
  }

  onSaveSuccess(donation: Donation): void {
    this.toast.success('Donasi manual berhasil disimpan.');
    this.router.navigateByUrl(kantongAmalPath.adminDonations);
  }
}
