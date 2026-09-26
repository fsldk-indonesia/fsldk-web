export interface NoteEntry {
  note: string;
  createdDate: string;
}

/** Ringkasan dashboard untuk caller bertipe LDK. */
export interface LDKSummary {
  submissionStatus: string;
  lastUpdatedDate?: string;
  levelCode?: string;
  levelLabel?: string;
  kaderPending: number;
  kaderActive: number;
  recentNotes: NoteEntry[];
}

export interface StatusCounts {
  belumMengisi: number;
  menungguVerifikasi: number;
  perluRevisi: number;
  terverifikasi: number;
}

/** Ringkasan dashboard untuk caller bertipe Puskomda. */
export interface PuskomdaSummary extends StatusCounts {
  totalLDK: number;
  totalKaderAktif: number;
}

export interface LevelCount {
  levelCode: string;
  levelLabel: string;
  count: number;
}

export interface PuskomdaBreakdown {
  organizationID: number;
  organizationName: string;
  totalLDK: number;
  kaderAktif: number;
}

/** Ringkasan dashboard untuk caller bertipe Puskomnas. */
export interface PuskomnasSummary extends StatusCounts {
  totalLDKNasional: number;
  levelEstablishedCount: number;
  totalPuskomda: number;
  totalKaderAktifNasional: number;
  levelDistribution: LevelCount[];
  perPuskomda: PuskomdaBreakdown[];
}

/** Ringkasan dashboard khusus CMS Utama — metrik administrasi sistem (satu
 *  field per modul sidebar CMS Utama, lihat dashboard_dto.UtamaSummary di
 *  backend — tambah modul baru di kedua sisi sekaligus) PLUS ringkasan
 *  jaringan Levelisasi nasional (StatusCounts + network*), sama persis
 *  dengan yang dipakai PuskomnasSummary — supaya Super Admin bisa melihat
 *  kondisi jaringan nasional langsung dari CMS Utama. */
export interface UtamaSummary extends StatusCounts {
  totalUsers: number;
  totalRoles: number;
  totalNews: number;
  totalArticles: number;
  totalEvents: number;
  totalSchedules: number;
  totalGalleries: number;
  totalStructures: number;
  totalCatalogBooks: number;
  totalDynamicForms: number;
  totalGoodsProducts: number;
  totalFinanceFormats: number;
  totalCampaigns: number;
  totalDonationCollected: number;
  totalComments: number;
  totalShortlinks: number;
  totalQrcodes: number;
  totalSubscribers: number;
  unreadContactMessages: number;
  pendingJobs: number;
  networkTotalLDK: number;
  networkTotalPuskomda: number;
  networkKaderAktif: number;
  networkLevelDistribution: LevelCount[];
  networkPerPuskomda: PuskomdaBreakdown[];
}

/** Response GET /dashboard/summary — hanya satu dari utama/ldk/puskomda/puskomnas terisi. */
export interface DashboardSummary {
  organizationTypeCode: string;
  utama?: UtamaSummary;
  ldk?: LDKSummary;
  puskomda?: PuskomdaSummary;
  puskomnas?: PuskomnasSummary;
}
