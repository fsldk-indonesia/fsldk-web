/** Profil pengguna yang sedang login (klaim dari JWT / GET /auth/me). */
export interface UserProfile {
  userID: number;
  fullName: string;
  email: string;
  emailVerified: boolean;
  role: string;
  permissions: string[];
  photoURL?: string;
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
}
