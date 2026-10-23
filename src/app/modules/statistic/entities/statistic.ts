export interface ProvinceCount {
  provinceName: string;
  count: number;
}

export interface LevelCount {
  levelCode: string;
  levelLabel: string;
  count: number;
}

export interface CityCount {
  cityName: string;
  count: number;
}

export interface NetworkStats {
  totalPuskomnas: number;
  totalPuskomda: number;
  totalLDK: number;
  totalActiveKader: number;
  byProvince: ProvinceCount[];
  byLevel: LevelCount[];
  byCity: CityCount[];
}

/** Satu organisasi dalam direktori jaringan publik — photoURL adalah logo LDK/Puskomda/Puskomnas, bila diisi.
 *  parentOrganizationID/parentOrganizationName kosong untuk Puskomnas akar (tidak punya induk) — dipakai
 *  menyusun direktori sebagai tree Puskomnas -> Puskomda -> LDK, mencerminkan ms_organization.parentOrganizationID.
 *  contactEmail/contactPhone/websiteURL sengaja ditampilkan apa adanya di kartu publik (keputusan produk,
 *  bukan kealpaan) — lihat statistic_dto.DirectoryEntry di backend. levelCode/levelLabel hanya terisi untuk
 *  hasil Levelisasi LDK yang CURRENT dan SUDAH PUBLISH — organisasi non-LDK atau LDK yang belum publish
 *  hasilnya akan menerima keduanya sebagai undefined, sama aturannya dengan chart "Distribusi Level LDK". */
export interface DirectoryEntry {
  organizationID: number;
  organizationTypeCode: string;
  organizationName: string;
  organizationCode: string;
  provinceName?: string;
  cityName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteURL?: string;
  photoURL?: string;
  parentOrganizationID?: number;
  parentOrganizationName?: string;
  levelCode?: string;
  levelLabel?: string;
}

/** Tema warna badge level per levelCode (lk_level, 4 baris seed) — disusun
 *  sebagai tangga capaian memakai token warna yang sudah ada di styles.scss
 *  (tidak menambah warna baru): Pra Mula netral/abu, Mula biru, Madya emas,
 *  Mandiri hijau (warna brand, level tertinggi). */
export const LEVEL_BADGE_CLASS: Record<string, string> = {
  PRA_MULA: 'level-badge-neutral',
  MULA: 'level-badge-info',
  MADYA: 'level-badge-gold',
  MANDIRI: 'level-badge-primary',
};
export function levelBadgeClass(levelCode: string): string { return LEVEL_BADGE_CLASS[levelCode] ?? 'level-badge-neutral'; }
