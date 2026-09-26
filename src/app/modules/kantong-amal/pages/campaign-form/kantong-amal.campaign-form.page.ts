import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignDetail } from '../../entities/campaign';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { MoneyInputComponent } from '../../../../shared/money-input.component';
import { PhoneInputComponent } from '../../../../shared/phone-input.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CampaignCategory } from '../../entities/campaign';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalCampaignFormPresenter } from './kantong-amal.campaign-form.presenter';
import { KantongAmalCampaignFormView } from './kantong-amal.campaign-form.view';

interface CampaignFormValue {
  title: string;
  categoryID: number | null;
  provinceName: string;
  cityName: string;
  story: string;
  goals: string;
  coverImageUrl: string;
  supportingImageUrls: string[];
  targetAmount: number | null;
  picName: string;
  picPhone: string;
  organizationNameOverride: string;
  organizationLogoUrl: string;
  organizationLinkUrl: string;
  startDate: string;
  endDate: string;
  isAnonymousAllowed: boolean;
  latestUpdate: string;
}

const EMPTY_FORM: CampaignFormValue = {
  title: '', categoryID: null, provinceName: '', cityName: '',
  story: '', goals: '', coverImageUrl: '', supportingImageUrls: [],
  targetAmount: null, picName: '', picPhone: '',
  organizationNameOverride: '', organizationLogoUrl: '', organizationLinkUrl: '',
  startDate: '', endDate: '', isAnonymousAllowed: true, latestUpdate: '',
};

@Component({
  selector: 'app-kantong-amal-campaign-form-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-form.page.html',
  imports: [RouterLink, FormsModule, IconComponent, ImageUploadComponent, MoneyInputComponent, PhoneInputComponent, SelectComponent, DateTimePickerComponent, RichTextEditorComponent],
  providers: [KantongAmalCampaignFormPresenter],
  styles: [`
    /* Lebar dibiarkan mengisi penuh .page-shell (bukan dikunci ke 820px
       center) — disamakan dengan pola form Berita/Artikel/dst. (lihat
       article.form.page.ts): page-shell CMS sudah dibatasi 1100px dengan
       padding sendiri, jadi mengunci form ke max-width sempit LAGI di
       dalamnya cuma menyisakan ruang kosong besar di kanan-kiri tanpa guna
       (dilaporkan "space besar"). */
    .page-head { margin: 0 0 24px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .support-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 10px; }
    .support-image-item { position: relative; }
    .support-image-item .remove-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,.55); color: #fff; border: none; border-radius: 999px; width: 22px; height: 22px; cursor: pointer; }
    .readonly-note { display: flex; gap: 10px; align-items: flex-start; background: var(--color-bg-alt); border-radius: var(--radius-xs); padding: 12px 14px; font-size: .84rem; color: var(--color-text-secondary); line-height: 1.5; }
    .readonly-note app-icon { flex-shrink: 0; margin-top: 1px; }
    .toggle-row { display: flex; align-items: center; gap: 10px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }
  `],
})
export class KantongAmalCampaignFormPage implements OnInit, KantongAmalCampaignFormView {
  private presenter = inject(KantongAmalCampaignFormPresenter);
  private campaignRepo = inject(CampaignRepository);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  editId: number | null = null;
  campaign = signal<CampaignDetail | null>(null);
  categories = signal<CampaignCategory[]>([]);
  loading = signal(true);
  saving = signal(false);

  form: CampaignFormValue = { ...EMPTY_FORM };

  /** Toggle UI murni (tidak dikirim ke backend) untuk menampilkan/menyembunyikan
   *  blok "Organisasi Penyelenggara" — revisi: sebelumnya blok ini selalu
   *  tampil meski kosong (revision-prompt-3.md poin 1). */
  organizationEnabled = false;

  readonly kantongAmalPath = kantongAmalPath;

  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat kantong-amal.routes.ts),
  // pola sama seperti Formulir Dinamis/Berita. Digabung dengan aturan lama
  // "ARCHIVED selalu read-only" lewat OR, bukan menggantikannya.
  private viewOnlyRoute = false;

  get categoryOptions(): SelectOption[] { return this.categories().map((c) => ({ value: c.campaignCategoryID, label: c.categoryName })); }
  get isReadonly(): boolean {
    return this.viewOnlyRoute || this.campaign()?.status === 'ARCHIVED';
  }
  get pageTitle(): string {
    if (this.viewOnlyRoute) return 'Detail Campaign';
    return this.editId ? 'Ubah Campaign' : 'Buat Campaign Baru';
  }
  get pageSubtitle(): string {
    if (this.viewOnlyRoute) return 'Lihat detail lengkap campaign ini.';
    return this.editId ? 'Perbarui informasi campaign yang sudah ada.' : 'Isi informasi campaign penggalangan dana yang akan dipublikasikan.';
  }
  get readonlyNote(): string {
    if (this.campaign()?.status === 'ARCHIVED') return 'Campaign ini sudah diarsipkan dan tidak dapat diubah dari sini.';
    return 'Anda melihat campaign ini dalam mode baca saja.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.viewOnlyRoute = this.route.snapshot.data['viewOnly'] === true;
    this.campaignRepo.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.presenter.load(this.editId);
    } else {
      this.loading.set(false);
    }
  }

  /** Dipanggil saat toggle "organisasi di luar FSLDK" dimatikan — kosongkan
   *  field organisasi supaya tidak diam-diam tersimpan sambil disembunyikan. */
  onOrganizationToggleChange(enabled: boolean): void {
    this.organizationEnabled = enabled;
    if (!enabled) {
      this.form.organizationNameOverride = '';
      this.form.organizationLogoUrl = '';
      this.form.organizationLinkUrl = '';
    }
  }

  addSupportingImage(): void { this.form.supportingImageUrls = [...this.form.supportingImageUrls, '']; }
  removeSupportingImage(index: number): void { this.form.supportingImageUrls = this.form.supportingImageUrls.filter((_, i) => i !== index); }
  setSupportingImage(index: number, url: string): void {
    const next = [...this.form.supportingImageUrls];
    next[index] = url;
    this.form.supportingImageUrls = next;
  }

  /** Mengembalikan pesan field wajib pertama yang belum valid, atau null bila
   *  form sudah lengkap — dipakai save() untuk menunjukkan persis apa yang
   *  kurang (tombol Simpan sendiri TIDAK di-disable berdasarkan ini, supaya
   *  pengguna selalu bisa klik & lihat pesannya, bukan macet tanpa penjelasan
   *  seperti sebelumnya — lihat revision-prompt-3.md poin 1). */
  private firstValidationError(): string | null {
    if (!this.form.title) return 'Judul campaign wajib diisi.';
    if (!this.form.categoryID) return 'Kategori wajib dipilih.';
    if (this.plainTextLength(this.form.story) < 50) return 'Cerita wajib diisi, minimal 50 karakter.';
    if (!this.form.goals) return 'Tujuan penggalangan dana wajib diisi.';
    if (!this.form.coverImageUrl) return 'Gambar sampul wajib diunggah.';
    if (!this.form.targetAmount || this.form.targetAmount <= 0) return 'Target dana wajib diisi.';
    if (!this.form.picName) return 'Nama PIC wajib diisi.';
    if (!this.form.picPhone) return 'No. WhatsApp PIC wajib diisi.';
    return null;
  }

  /** Cerita disimpan sebagai HTML (dari TinyMCE) — hitung panjang teks
   *  polosnya saja untuk validasi "minimal 50 karakter", bukan panjang
   *  markup-nya (mis. `<p></p>` tidak boleh ikut dianggap konten). */
  private plainTextLength(html: string): number {
    return html.replace(/<[^>]*>/g, '').trim().length;
  }

  isFormValid(): boolean {
    return this.firstValidationError() === null;
  }

  save(): void {
    const error = this.firstValidationError();
    if (error) { this.toast.error(error); return; }
    const supportingImageUrls = this.form.supportingImageUrls.filter((u) => !!u);
    const base = {
      title: this.form.title, categoryID: this.form.categoryID!, organizationID: null,
      provinceName: this.form.provinceName, cityName: this.form.cityName,
      story: this.form.story, goals: this.form.goals, coverImageUrl: this.form.coverImageUrl,
      supportingImageUrls, targetAmount: this.form.targetAmount!,
      picName: this.form.picName, picPhone: this.form.picPhone,
      organizationNameOverride: this.form.organizationNameOverride,
      organizationLogoUrl: this.form.organizationLogoUrl, organizationLinkUrl: this.form.organizationLinkUrl,
      startDate: this.form.startDate || null, endDate: this.form.endDate || null,
      isAnonymousAllowed: this.form.isAnonymousAllowed,
    };
    if (this.editId) {
      this.presenter.update(this.editId, { ...base, latestUpdate: this.form.latestUpdate });
    } else {
      this.presenter.create(base);
    }
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }

  setCampaign(campaign: CampaignDetail | null): void {
    this.campaign.set(campaign);
    if (!campaign) return;
    this.form = {
      title: campaign.title, categoryID: campaign.categoryID,
      provinceName: campaign.provinceName ?? '', cityName: campaign.cityName ?? '',
      story: campaign.story, goals: campaign.goals ?? '', coverImageUrl: campaign.coverImageUrl,
      supportingImageUrls: campaign.supportingImageUrls ?? [], targetAmount: campaign.targetAmount,
      picName: campaign.picName ?? '', picPhone: campaign.picPhone ?? '',
      organizationNameOverride: campaign.organizationNameOverride ?? '',
      organizationLogoUrl: campaign.organizationLogoUrl ?? '', organizationLinkUrl: campaign.organizationLinkUrl ?? '',
      // slice(0, 16) -> "YYYY-MM-DDTHH:mm", format yang dipakai <app-datetime-picker>
      // dengan showTime=true (jam & menit ikut, bukan cuma tanggal — revisi startDate/
      // endDate "pakai tanggal sampai waktu", revision-prompt-3.md poin 1). Berlaku sama
      // untuk string RFC3339 apapun dari backend, dengan atau tanpa offset timezone.
      startDate: campaign.startDate?.slice(0, 16) ?? '', endDate: campaign.endDate?.slice(0, 16) ?? '',
      isAnonymousAllowed: campaign.isAnonymousAllowed, latestUpdate: campaign.latestUpdate ?? '',
    };
    this.organizationEnabled = !!this.form.organizationNameOverride;
  }

  onSaveSuccess(): void {
    this.toast.success('Campaign berhasil disimpan.');
    // Simpan (baik buat baru maupun ubah) selalu kembali ke daftar Campaign —
    // sebelumnya update tetap di halaman edit, yang terasa seperti "tidak
    // terjadi apa-apa" setelah menekan Simpan (revisi: harus ke index).
    this.router.navigateByUrl(kantongAmalPath.adminCampaigns);
  }
}
