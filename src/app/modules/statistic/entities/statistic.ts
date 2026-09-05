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

/** Satu organisasi dalam direktori jaringan publik — photoURL adalah logo LDK/Puskomda/Puskomnas, bila diisi. */
export interface DirectoryEntry {
  organizationID: number;
  organizationTypeCode: string;
  organizationName: string;
  provinceName?: string;
  cityName?: string;
  photoURL?: string;
}
