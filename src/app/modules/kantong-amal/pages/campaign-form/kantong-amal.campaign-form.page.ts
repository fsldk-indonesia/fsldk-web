import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignDetail } from '../../entities/campaign';
import { BankListItem } from '../../entities/withdrawal';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CampaignCategory } from '../../entities/campaign';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalCampaignFormPresenter } from './kantong-amal.campaign-form.presenter';
import { KantongAmalCampaignFormView } from './kantong-amal.campaign-form.view';

interface CampaignFormValue {
  title: string;
  categoryID: number | null;
  story: string;
  coverImageUrl: string;
  supportingImageUrls: string[];
  targetAmount: number | null;
  beneficiaryName: string;
  beneficiaryBankCode: string | null;
  beneficiaryAccountNumber: string;
  beneficiaryAccountHolder: string;
  startDate: string;
  endDate: string;
  isAnonymousAllowed: boolean;
  latestUpdate: string;
}

const EMPTY_FORM: CampaignFormValue = {
  title: '', categoryID: null, story: '', coverImageUrl: '', supportingImageUrls: [],
  targetAmount: null, beneficiaryName: '', beneficiaryBankCode: null, beneficiaryAccountNumber: '', beneficiaryAccountHolder: '',
  startDate: '', endDate: '', isAnonymousAllowed: true, latestUpdate: '',
};

@Component({
  selector: 'app-kantong-amal-campaign-form-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-form.page.html',
  imports: [RouterLink, FormsModule, ImageUploadComponent, SelectComponent],
  providers: [KantongAmalCampaignFormPresenter],
  styles: [`
    .page-head { max-width: 820px; margin: 0 auto 24px; }
    .form-card { max-width: 820px; margin: 0 auto; }
    .support-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 10px; }
    .support-image-item { position: relative; }
    .support-image-item .remove-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,.55); color: #fff; border: none; border-radius: 999px; width: 22px; height: 22px; cursor: pointer; }
    .readonly-note { background: var(--color-bg-alt); border-radius: var(--radius-sm); padding: 12px 16px; font-size: .88rem; color: var(--color-text-secondary); margin-bottom: 20px; }
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
  banks = signal<BankListItem[]>([]);
  loading = signal(true);
  saving = signal(false);

  form: CampaignFormValue = { ...EMPTY_FORM };

  readonly kantongAmalPath = kantongAmalPath;

  get categoryOptions(): SelectOption[] { return this.categories().map((c) => ({ value: c.campaignCategoryID, label: c.categoryName })); }
  get bankOptions(): SelectOption[] { return this.banks().map((b) => ({ value: b.bankCode, label: b.name })); }
  get isReadonly(): boolean {
    const status = this.campaign()?.status;
    return !!status && status !== 'DRAFT' && status !== 'REVISION_REQUESTED';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadBanks();
    this.campaignRepo.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.presenter.load(this.editId);
    } else {
      this.loading.set(false);
    }
  }

  addSupportingImage(): void { this.form.supportingImageUrls = [...this.form.supportingImageUrls, '']; }
  removeSupportingImage(index: number): void { this.form.supportingImageUrls = this.form.supportingImageUrls.filter((_, i) => i !== index); }
  setSupportingImage(index: number, url: string): void {
    const next = [...this.form.supportingImageUrls];
    next[index] = url;
    this.form.supportingImageUrls = next;
  }

  canSubmitForm(): boolean {
    return !!this.form.title && !!this.form.categoryID && this.form.story.length >= 50 && !!this.form.coverImageUrl
      && !!this.form.targetAmount && this.form.targetAmount > 0 && !!this.form.beneficiaryName
      && !!this.form.beneficiaryBankCode && !!this.form.beneficiaryAccountNumber && !!this.form.beneficiaryAccountHolder && !this.saving();
  }

  save(): void {
    if (!this.canSubmitForm()) { this.toast.error('Lengkapi seluruh field wajib (cerita minimal 50 karakter).'); return; }
    const supportingImageUrls = this.form.supportingImageUrls.filter((u) => !!u);
    const base = {
      title: this.form.title, categoryID: this.form.categoryID!, story: this.form.story, coverImageUrl: this.form.coverImageUrl,
      supportingImageUrls, targetAmount: this.form.targetAmount!, beneficiaryName: this.form.beneficiaryName,
      beneficiaryBankCode: this.form.beneficiaryBankCode!, beneficiaryAccountNumber: this.form.beneficiaryAccountNumber,
      beneficiaryAccountHolder: this.form.beneficiaryAccountHolder, startDate: this.form.startDate || null, endDate: this.form.endDate || null,
      isAnonymousAllowed: this.form.isAnonymousAllowed,
    };
    if (this.editId) {
      this.presenter.update(this.editId, { ...base, latestUpdate: this.form.latestUpdate });
    } else {
      this.presenter.create(base);
    }
  }

  submitForReview(): void {
    if (!this.editId) return;
    this.presenter.submit(this.editId);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  setBanks(banks: BankListItem[]): void { this.banks.set(banks); }

  setCampaign(campaign: CampaignDetail | null): void {
    this.campaign.set(campaign);
    if (!campaign) return;
    this.form = {
      title: campaign.title, categoryID: campaign.categoryID, story: campaign.story, coverImageUrl: campaign.coverImageUrl,
      supportingImageUrls: campaign.supportingImageUrls ?? [], targetAmount: campaign.targetAmount,
      beneficiaryName: campaign.beneficiaryName, beneficiaryBankCode: campaign.beneficiaryBankCode,
      beneficiaryAccountNumber: campaign.beneficiaryAccountNumber, beneficiaryAccountHolder: campaign.beneficiaryAccountHolder,
      startDate: campaign.startDate?.slice(0, 10) ?? '', endDate: campaign.endDate?.slice(0, 10) ?? '',
      isAnonymousAllowed: campaign.isAnonymousAllowed, latestUpdate: campaign.latestUpdate ?? '',
    };
  }

  onSaveSuccess(campaign: CampaignDetail): void {
    this.toast.success('Campaign berhasil disimpan.');
    if (!this.editId) this.router.navigateByUrl(kantongAmalPath.campaignEdit(campaign.campaignID));
    else this.setCampaign(campaign);
  }

  onSubmitSuccess(): void {
    this.toast.success('Campaign diajukan untuk ditinjau admin.');
    this.router.navigateByUrl(kantongAmalPath.myCampaigns);
  }
}
