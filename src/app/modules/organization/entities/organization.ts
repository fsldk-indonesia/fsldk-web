/** Satu baris organisasi (LDK/Puskomda/Puskomnas). */
export interface Organization {
  organizationID: number;
  organizationTypeCode: 'LDK' | 'PUSKOMDA' | 'PUSKOMNAS';
  organizationName: string;
  organizationCode: string;
  parentOrganizationID?: number;
  parentOrganizationName?: string;
  provinceName?: string;
  cityName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdDate: string;
}

/** Entri ringkas daftar organisasi yang dapat diakses caller (GET /me/organizations). */
export interface MeOrganization {
  organizationID: number;
  organizationTypeCode: 'LDK' | 'PUSKOMDA' | 'PUSKOMNAS';
  organizationName: string;
  parentOrganizationID?: number;
}
