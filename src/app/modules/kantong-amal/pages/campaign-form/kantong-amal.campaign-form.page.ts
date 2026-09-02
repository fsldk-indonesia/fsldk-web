import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignDetail } from '../../entities/campaign';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
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
  imports: [RouterLink, FormsModule, ImageUploadComponent, SelectComponent, DateTimePickerComponent, RichTextEditorComponent],
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
  loading = signal(true);
  saving = signal(false);

  form: CampaignFormValue = { ...EMPTY_FORM };

  readonly kantongAmalPath = kantongAmalPath;

  get categoryOptions(): SelectOption[] { return this.categories().map((c) => ({ value: c.campaignCategoryID, label: c.categoryName })); }
  get isReadonly(): boolean {
    // Campaign murni CRUD — boleh diedit siapapun berhak di status apapun
    // kecuali ARCHIVED, konsisten dengan backend Update().
    return this.campaign()?.status === 'ARCHIVED';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
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

  isFormValid(): boolean {
    return !!this.form.title && !!this.form.categoryID && this.form.story.length >= 50 && !!this.form.goals
      && !!this.form.coverImageUrl && !!this.form.targetAmount && this.form.targetAmount > 0
      && !!this.form.picName && !!this.form.picPhone && !this.saving();
  }

  save(): void {
    if (!this.isFormValid()) { this.toast.error('Lengkapi seluruh field wajib (cerita minimal 50 karakter).'); return; }
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
      startDate: campaign.startDate?.slice(0, 10) ?? '', endDate: campaign.endDate?.slice(0, 10) ?? '',
      isAnonymousAllowed: campaign.isAnonymousAllowed, latestUpdate: campaign.latestUpdate ?? '',
    };
  }

  onSaveSuccess(campaign: CampaignDetail): void {
    this.toast.success('Campaign berhasil disimpan.');
    if (!this.editId) this.router.navigateByUrl(kantongAmalPath.campaignEdit(campaign.campaignID));
    else this.setCampaign(campaign);
  }
}
