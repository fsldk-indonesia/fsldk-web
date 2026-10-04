export interface ProvinceCount {
  provinceName: string;
  count: number;
}

export interface LevelCount {
  levelCode: string;
  levelLabel: string;
  count: number;
}

export interface NetworkStats {
  totalPuskomnas: number;
  totalPuskomda: number;
  totalLDK: number;
  totalActiveKader: number;
  byProvince: ProvinceCount[];
  byLevel: LevelCount[];
}

/** Satu organisasi dalam direktori jaringan publik — photoURL adalah logo LDK/Puskomda/Puskomnas, bila diisi.
 *  parentOrganizationID/parentOrganizationName kosong untuk Puskomnas akar (tidak punya induk) — dipakai
 *  menyusun direktori sebagai tree Puskomnas -> Puskomda -> LDK, mencerminkan ms_organization.parentOrganizationID.
 *  contactEmail/contactPhone/websiteURL sengaja ditampilkan apa adanya di kartu publik (keputusan produk,
 *  bukan kealpaan) — lihat statistic_dto.DirectoryEntry di backend. */
export interface DirectoryEntry {
  organizationID: number;
  organizationTypeCode: string;
  organizationName: string;
  provinceName?: string;
  cityName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteURL?: string;
  photoURL?: string;
  parentOrganizationID?: number;
  parentOrganizationName?: string;
}
