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
  ownerUserID: number;
  ownerName: string;
  organizationID?: number;
  organizationName?: string;
  story: string;
  latestUpdate?: string;
  coverImageUrl: string;
  targetAmount: number;
  collectedAmount: number;
  beneficiaryName: string;
  beneficiaryBankCode: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountHolder: string;
  startDate?: string;
  endDate?: string;
  status: CampaignStatus;
  moderationNote?: string;
  isFeatured: boolean;
  isAnonymousAllowed: boolean;
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

export interface CampaignReview {
  reviewID: number;
  reviewerName: string;
  decision: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  note?: string;
  reviewedDate: string;
}

export interface CreateCampaignRequest {
  title: string;
  categoryID: number;
  organizationID?: number | null;
  story: string;
  coverImageUrl: string;
  supportingImageUrls?: string[];
  targetAmount: number;
  beneficiaryName: string;
  beneficiaryBankCode: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountHolder: string;
  startDate?: string | null;
  endDate?: string | null;
  isAnonymousAllowed?: boolean;
}

export interface UpdateCampaignRequest extends CreateCampaignRequest {
  latestUpdate?: string;
}

export interface UpdateBeneficiaryRequest {
  beneficiaryName: string;
  beneficiaryBankCode: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountHolder: string;
}
