export type CampaignStatus =
  | 'DRAFT' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'PUBLISHED'
  | 'PAUSED' | 'COMPLETED' | 'REJECTED' | 'ARCHIVED' | 'EXPIRED';

export interface Campaign {
  campaignID: number;
  publicRef: string;
  slug: string;
  title: string;
  categoryID: number;
  categoryName: string;
  organizationID?: number;
  organizationName?: string;
  provinceName?: string;
  cityName?: string;
  story: string;
  goals: string;
  latestUpdate?: string;
  coverImageUrl: string;
  targetAmount: number;
  collectedAmount: number;
  picName: string;
  picPhone: string;
  organizationNameOverride?: string;
  organizationLogoUrl?: string;
  organizationLinkUrl?: string;
  startDate?: string;
  endDate?: string;
  status: CampaignStatus;
  moderationNote?: string;
  isFeatured: boolean;
  isAnonymousAllowed: boolean;
  hasDonations: boolean;
  createdDate: string;
}

export interface CampaignDetail extends Campaign {
  supportingImageUrls: string[];
}

export interface CampaignCategory {
  campaignCategoryID: number;
  categoryCode: string;
  categoryName: string;
}

export interface CampaignLite {
  campaignID: number;
  title: string;
}

export interface CreateCampaignRequest {
  title: string;
  categoryID: number;
  organizationID?: number | null;
  provinceName?: string;
  cityName?: string;
  story: string;
  goals: string;
  coverImageUrl: string;
  supportingImageUrls?: string[];
  targetAmount: number;
  picName: string;
  picPhone: string;
  organizationNameOverride?: string;
  organizationLogoUrl?: string;
  organizationLinkUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  isAnonymousAllowed?: boolean;
}

export interface UpdateCampaignRequest extends CreateCampaignRequest {
  latestUpdate?: string;
}
