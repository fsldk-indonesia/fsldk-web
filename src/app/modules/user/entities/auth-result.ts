import { UserProfile } from './user';

/** Hasil sukses login/registrasi Google/refresh — token + profil. */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}
