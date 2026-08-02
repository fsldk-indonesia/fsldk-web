export interface RegisterView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(email: string): void;
  navigateAfterLogin(hasCmsAccess: boolean): void;
}
