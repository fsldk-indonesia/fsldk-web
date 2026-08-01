import { Injectable } from '@angular/core';
import { AuthResult } from '../entities/auth-result';
import { UserProfile } from '../entities/user';

const ACCESS_KEY = 'fsldk.accessToken';
const REFRESH_KEY = 'fsldk.refreshToken';
const USER_KEY = 'fsldk.user';

/** Penyimpanan sesi murni (localStorage) — tidak memanggil API. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  get accessToken(): string | null { return localStorage.getItem(ACCESS_KEY); }
  get refreshToken(): string | null { return localStorage.getItem(REFRESH_KEY); }

  loadUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  }

  persist(res: AuthResult): void {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  persistUser(user: UserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
