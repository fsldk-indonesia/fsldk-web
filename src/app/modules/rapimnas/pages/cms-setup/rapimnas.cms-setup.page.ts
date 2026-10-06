import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import {
  RapimnasCms, RapimnasContact, RapimnasHomeCard, RapimnasPickupLocation,
  RapimnasResource, RapimnasRundownDay, RapimnasUpdatePayload,
} from '../../entities/rapimnas';
import { RapimnasCmsSetupPresenter } from './rapimnas.cms-setup.presenter';
import { RapimnasCmsSetupView } from './rapimnas.cms-setup.view';

type RapimnasSetupTab = 'hero' | 'beranda' | 'tentang' | 'jadwal' | 'arsip' | 'peserta' | 'panitia' | 'footer';

interface SimpleContact { name: string; phoneNumber: string; }

@Component({
  selector: 'app-rapimnas-cms-setup-page',
  standalone: true,
  templateUrl: './rapimnas.cms-setup.page.html',
  imports: [FormsModule, ImageUploadComponent],
  providers: [RapimnasCmsSetupPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-section-card { margin-bottom: 20px; }
    .form-section-card:last-of-type { margin-bottom: 0; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 20px; flex-wrap: wrap; }
    .tabs button { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; transition: color var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .tabs button:hover { color: var(--color-primary-dark); }
    .tabs button.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
    .tab-panel { animation: tab-fade-in .28s ease; }
    @keyframes tab-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    .repeater-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center; }
    .repeater-row:last-of-type { margin-bottom: 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 20px; border-top: 1px solid var(--color-border); }
    .mt-lg { margin-top: 24px; }
  `],
})
export class RapimnasCmsSetupPage implements OnInit, RapimnasCmsSetupView {
  private presenter = inject(RapimnasCmsSetupPresenter);

  loading = signal(true);
  saving = signal(false);
  tab = signal<RapimnasSetupTab>('hero');

  // Hero
  heroBadgeText = '';
  heroTitle = '';
  heroDateRangeText = '';
  heroTaglineQuote = '';
  heroImageUrl: string | null = null;
  countdownTargetDate = '';

  // Beranda (Task 19)
  feature1IconKey = '';
  feature1Title = '';
  feature1Desc = '';
  feature2IconKey = '';
  feature2Title = '';
  feature2Desc = '';
  ctaTitle = '';
  ctaDescription = '';
  ctaButtonLabel = '';
  ctaMascotImageUrl: string | null = null;
  galleryImageUrls: string[] = [];
  homeCards: RapimnasHomeCard[] = [];

  // Tentang (Task 20)
  tentangTaglineQuote = '';
  tentangDescParagraph1 = '';
  tentangDescParagraph2 = '';
  tentangVisiText = '';
  tentangMisi: string[] = [];
  tentangTujuan: string[] = [];
  tentangKegiatan: string[] = [];

  // Jadwal (Task 21)
  jadwalHeaderSubtitle = '';
  rundownDays: RapimnasRundownDay[] = [];

  // Arsip (Task 22)
  resources: RapimnasResource[] = [];

  // Pendaftaran Peserta (Task 23)
  pesertaEarlyBirdDateRange = '';
  pesertaRegulerDateRange = '';
  pesertaHargaNonSemarangEarlyBird: number | null = null;
  pesertaHargaNonSemarangReguler: number | null = null;
  pesertaHargaSemarangEarlyBird: number | null = null;
  pesertaHargaSemarangReguler: number | null = null;
  pesertaBankName = '';
  pesertaBankAccountNumber = '';
  pesertaBankAccountHolder = '';
  pesertaGuidebookUrl = '';
  pesertaGoogleFormUrl = '';
  pesertaMapEmbedUrl = '';
  pickupLocations: RapimnasPickupLocation[] = [];
  pesertaCpContacts: SimpleContact[] = [];

  // Pendaftaran Panitia
  panitiaIsOpen = false;
  panitiaClosedMessage = '';

  // Footer / Kontak
  footerContactEmail = '';
  footerCopyrightText = '';
  footerIgHandle = '';
  footerIgUrl = '';
  footerTiktokHandle = '';
  footerTiktokUrl = '';
  footerWaContacts: SimpleContact[] = [];

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setForm(data: RapimnasCms): void {
    this.heroBadgeText = data.heroBadgeText;
    this.heroTitle = data.heroTitle;
    this.heroDateRangeText = data.heroDateRangeText;
    this.heroTaglineQuote = data.heroTaglineQuote;
    this.heroImageUrl = data.heroImageUrl;
    this.countdownTargetDate = this.toLocalInput(data.countdownTargetDate);

    this.feature1IconKey = data.feature1IconKey;
    this.feature1Title = data.feature1Title;
    this.feature1Desc = data.feature1Desc;
    this.feature2IconKey = data.feature2IconKey;
    this.feature2Title = data.feature2Title;
    this.feature2Desc = data.feature2Desc;
    this.ctaTitle = data.ctaTitle;
    this.ctaDescription = data.ctaDescription;
    this.ctaButtonLabel = data.ctaButtonLabel;
    this.ctaMascotImageUrl = data.ctaMascotImageUrl;
    this.galleryImageUrls = data.galleryImages.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((g) => g.imageUrl);
    this.homeCards = data.homeCards.slice().sort((a, b) => a.sortOrder - b.sortOrder);

    this.tentangTaglineQuote = data.tentangTaglineQuote;
    this.tentangDescParagraph1 = data.tentangDescParagraph1;
    this.tentangDescParagraph2 = data.tentangDescParagraph2;
    this.tentangVisiText = data.tentangVisiText;
    this.tentangMisi = [...data.tentangMisi];
    this.tentangTujuan = [...data.tentangTujuan];
    this.tentangKegiatan = [...data.tentangKegiatan];

    this.jadwalHeaderSubtitle = data.jadwalHeaderSubtitle;
    this.rundownDays = data.rundownDays.slice().sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => ({ ...d, events: d.events.slice().sort((a, b) => a.sortOrder - b.sortOrder) }));

    this.resources = data.resources.slice().sort((a, b) => a.sortOrder - b.sortOrder);

    this.pesertaEarlyBirdDateRange = data.pesertaEarlyBirdDateRange;
    this.pesertaRegulerDateRange = data.pesertaRegulerDateRange;
    this.pesertaHargaNonSemarangEarlyBird = data.pesertaHargaNonSemarangEarlyBird;
    this.pesertaHargaNonSemarangReguler = data.pesertaHargaNonSemarangReguler;
    this.pesertaHargaSemarangEarlyBird = data.pesertaHargaSemarangEarlyBird;
    this.pesertaHargaSemarangReguler = data.pesertaHargaSemarangReguler;
    this.pesertaBankName = data.pesertaBankName;
    this.pesertaBankAccountNumber = data.pesertaBankAccountNumber;
    this.pesertaBankAccountHolder = data.pesertaBankAccountHolder;
    this.pesertaGuidebookUrl = data.pesertaGuidebookUrl;
    this.pesertaGoogleFormUrl = data.pesertaGoogleFormUrl;
    this.pesertaMapEmbedUrl = data.pesertaMapEmbedUrl;
    this.pickupLocations = data.pickupLocations.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    this.pesertaCpContacts = this.extractContacts(data.contacts, 'peserta_cp');

    this.panitiaIsOpen = data.panitiaIsOpen;
    this.panitiaClosedMessage = data.panitiaClosedMessage;

    this.footerContactEmail = data.footerContactEmail;
    this.footerCopyrightText = data.footerCopyrightText;
    this.footerIgHandle = data.footerIgHandle;
    this.footerIgUrl = data.footerIgUrl;
    this.footerTiktokHandle = data.footerTiktokHandle;
    this.footerTiktokUrl = data.footerTiktokUrl;
    this.footerWaContacts = this.extractContacts(data.contacts, 'footer_wa');
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }

  save(): void {
    this.presenter.save(this.buildPayload());
  }

  addFooterWaContact(): void {
    this.footerWaContacts = [...this.footerWaContacts, { name: '', phoneNumber: '' }];
  }
  removeFooterWaContact(index: number): void {
    this.footerWaContacts = this.footerWaContacts.filter((_, i) => i !== index);
  }

  private extractContacts(contacts: RapimnasContact[], type: RapimnasContact['contactType']): SimpleContact[] {
    return contacts
      .filter((c) => c.contactType === type)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ name: c.name, phoneNumber: c.phoneNumber }));
  }

  private toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private buildPayload(): RapimnasUpdatePayload {
    return {
      heroBadgeText: this.heroBadgeText,
      heroTitle: this.heroTitle,
      heroDateRangeText: this.heroDateRangeText,
      heroTaglineQuote: this.heroTaglineQuote,
      heroImageUrl: this.heroImageUrl,
      countdownTargetDate: new Date(this.countdownTargetDate).toISOString(),
      feature1IconKey: this.feature1IconKey,
      feature1Title: this.feature1Title,
      feature1Desc: this.feature1Desc,
      feature2IconKey: this.feature2IconKey,
      feature2Title: this.feature2Title,
      feature2Desc: this.feature2Desc,
      ctaTitle: this.ctaTitle,
      ctaDescription: this.ctaDescription,
      ctaButtonLabel: this.ctaButtonLabel,
      ctaMascotImageUrl: this.ctaMascotImageUrl,
      footerContactEmail: this.footerContactEmail,
      footerCopyrightText: this.footerCopyrightText,
      footerIgHandle: this.footerIgHandle,
      footerIgUrl: this.footerIgUrl,
      footerTiktokHandle: this.footerTiktokHandle,
      footerTiktokUrl: this.footerTiktokUrl,
      jadwalHeaderSubtitle: this.jadwalHeaderSubtitle,
      tentangTaglineQuote: this.tentangTaglineQuote,
      tentangDescParagraph1: this.tentangDescParagraph1,
      tentangDescParagraph2: this.tentangDescParagraph2,
      tentangVisiText: this.tentangVisiText,
      tentangMisi: this.tentangMisi,
      tentangTujuan: this.tentangTujuan,
      tentangKegiatan: this.tentangKegiatan,
      pesertaEarlyBirdDateRange: this.pesertaEarlyBirdDateRange,
      pesertaRegulerDateRange: this.pesertaRegulerDateRange,
      pesertaHargaNonSemarangEarlyBird: Number(this.pesertaHargaNonSemarangEarlyBird ?? 0),
      pesertaHargaNonSemarangReguler: Number(this.pesertaHargaNonSemarangReguler ?? 0),
      pesertaHargaSemarangEarlyBird: Number(this.pesertaHargaSemarangEarlyBird ?? 0),
      pesertaHargaSemarangReguler: Number(this.pesertaHargaSemarangReguler ?? 0),
      pesertaBankName: this.pesertaBankName,
      pesertaBankAccountNumber: this.pesertaBankAccountNumber,
      pesertaBankAccountHolder: this.pesertaBankAccountHolder,
      pesertaGuidebookUrl: this.pesertaGuidebookUrl,
      pesertaGoogleFormUrl: this.pesertaGoogleFormUrl,
      pesertaMapEmbedUrl: this.pesertaMapEmbedUrl,
      panitiaIsOpen: this.panitiaIsOpen,
      panitiaClosedMessage: this.panitiaClosedMessage,
      galleryImages: this.galleryImageUrls.map((imageUrl, i) => ({ imageUrl, sortOrder: i })),
      homeCards: this.homeCards.map((c, i) => ({ ...c, sortOrder: i })),
      rundownDays: this.rundownDays.map((d, i) => ({
        ...d, sortOrder: i, events: d.events.map((e, j) => ({ ...e, sortOrder: j })),
      })),
      resources: this.resources.map((r, i) => ({ ...r, sortOrder: i })),
      pickupLocations: this.pickupLocations.map((p, i) => ({ ...p, sortOrder: i })),
      contacts: [
        ...this.pesertaCpContacts.map((c, i) => ({ contactType: 'peserta_cp' as const, name: c.name, phoneNumber: c.phoneNumber, sortOrder: i })),
        ...this.footerWaContacts.map((c, i) => ({ contactType: 'footer_wa' as const, name: c.name, phoneNumber: c.phoneNumber, sortOrder: i })),
      ],
    };
  }
}
