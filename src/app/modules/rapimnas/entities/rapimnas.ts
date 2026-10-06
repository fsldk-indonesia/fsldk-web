export interface RapimnasGalleryImage {
  imageUrl: string;
  sortOrder: number;
}

export interface RapimnasHomeCard {
  iconKey: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface RapimnasRundownEvent {
  time: string;
  title: string;
  description: string;
  venue: string;
  sortOrder: number;
}

export interface RapimnasRundownDay {
  dayLabel: string;
  dateText: string;
  sortOrder: number;
  events: RapimnasRundownEvent[];
}

export interface RapimnasResource {
  title: string;
  description: string;
  iconKey: string;
  url: string;
  buttonLabel: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface RapimnasPickupLocation {
  name: string;
  type: string;
  description: string;
  mapLink: string;
  sortOrder: number;
}

export type RapimnasContactType = 'peserta_cp' | 'footer_wa';

export interface RapimnasContact {
  contactType: RapimnasContactType;
  name: string;
  phoneNumber: string;
  sortOrder: number;
}

/**
 * Field singleton `ms_rapimnas_setting` (selalu id=1) — lihat design spec
 * §Backend > Data model. `tentangMisi`/`tentangTujuan`/`tentangKegiatan`:
 * backend menyimpannya sebagai LONGTEXT berisi string JSON array
 * (`tentangMisiJSON` dkk di kolom DB), TAPI `rapimnas_dto.PublicResponse`/
 * `CMSResponse` mendekodekannya jadi `string[]` biasa sebelum dikirim ke
 * frontend — modul ini TIDAK PERNAH menangani raw JSON string ini sendiri.
 */
export interface RapimnasSetting {
  heroBadgeText: string;
  heroTitle: string;
  heroDateRangeText: string;
  heroTaglineQuote: string;
  heroImageUrl: string | null;
  countdownTargetDate: string;
  feature1IconKey: string;
  feature1Title: string;
  feature1Desc: string;
  feature2IconKey: string;
  feature2Title: string;
  feature2Desc: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonLabel: string;
  ctaMascotImageUrl: string | null;
  footerContactEmail: string;
  footerCopyrightText: string;
  footerIgHandle: string;
  footerIgUrl: string;
  footerTiktokHandle: string;
  footerTiktokUrl: string;
  jadwalHeaderSubtitle: string;
  tentangTaglineQuote: string;
  tentangDescParagraph1: string;
  tentangDescParagraph2: string;
  tentangVisiText: string;
  tentangMisi: string[];
  tentangTujuan: string[];
  tentangKegiatan: string[];
  pesertaEarlyBirdDateRange: string;
  pesertaRegulerDateRange: string;
  pesertaHargaNonSemarangEarlyBird: number;
  pesertaHargaNonSemarangReguler: number;
  pesertaHargaSemarangEarlyBird: number;
  pesertaHargaSemarangReguler: number;
  pesertaBankName: string;
  pesertaBankAccountNumber: string;
  pesertaBankAccountHolder: string;
  pesertaGuidebookUrl: string;
  pesertaGoogleFormUrl: string;
  pesertaMapEmbedUrl: string;
  panitiaIsOpen: boolean;
  panitiaClosedMessage: string;
}

/** GET /public/rapimnas — semua yang dibutuhkan 6 halaman publik dalam satu panggilan. */
export interface RapimnasPublic extends RapimnasSetting {
  galleryImages: RapimnasGalleryImage[];
  homeCards: RapimnasHomeCard[];
  rundownDays: RapimnasRundownDay[];
  resources: RapimnasResource[];
  pickupLocations: RapimnasPickupLocation[];
  contacts: RapimnasContact[];
}

/** GET /rapimnas-setup (CMS) — sama dengan RapimnasPublic + audit. */
export interface RapimnasCms extends RapimnasPublic {
  updatedDate: string;
  updatedBy: number | null;
}

/** PUT /rapimnas-setup — seluruh nested shape dikirim sekali (satu tombol Simpan). */
export type RapimnasUpdatePayload = RapimnasPublic;
