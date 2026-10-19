/** Profil pengguna yang sedang login (klaim dari JWT / GET /auth/me). */
export interface UserProfile {
  userID: number;
  fullName: string;
  email: string;
  emailVerified: boolean;
  role: string;
  permissions: string[];
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  organizationID?: number;
  organizationTypeCode?: string;
  wildcardTierAccess?: string[];
  /** Nilai mentah ms_user.organizationID — BUKAN organizationID di atas
   *  (yang dikosongkan backend untuk Kader/Pengunjung, lihat
   *  resolveEffectiveOrg di auth_service_impl.go). Murni info "LDK Tujuan
   *  sudah dipilih atau belum" untuk Kader, tidak pernah berarti cakupan
   *  akses — dipakai halaman Pendataan supaya tidak minta pilih LDK lagi
   *  kalau sudah terkunci. */
  ldkTujuanOrganizationID?: number;
}

/** Ringkasan pengguna minimal untuk autocomplete @mention pada komentar. */
export interface MentionUser {
  userID: number;
  fullName: string;
  photoURL?: string;
}

/** Baris pengguna pada tabel manajemen pengguna CMS. */
export interface UserRow {
  userID: number;
  fullName: string;
  email: string;
  roleID: number;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  hasGoogle: boolean;
  hasPassword: boolean;
  organizationID?: number;
  organizationTypeCode?: string;
  wildcardTierAccess?: string[];
}
