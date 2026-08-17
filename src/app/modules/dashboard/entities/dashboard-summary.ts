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

/** Response GET /dashboard/summary — hanya satu dari ldk/puskomda/puskomnas terisi. */
export interface DashboardSummary {
  organizationTypeCode: string;
  ldk?: LDKSummary;
  puskomda?: PuskomdaSummary;
  puskomnas?: PuskomnasSummary;
}
