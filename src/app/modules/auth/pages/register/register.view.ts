export interface RegisterView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(email: string): void;
  navigateToDashboard(): void;
}
