export interface LoginView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(): void;
  navigateAfterLogin(hasCmsAccess: boolean): void;
}
