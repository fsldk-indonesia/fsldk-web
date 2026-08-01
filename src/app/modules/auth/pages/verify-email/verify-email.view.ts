export interface VerifyEmailView {
  setVerifying(verifying: boolean): void;
  setVerified(verified: boolean): void;
  setResendLoading(loading: boolean): void;
  showInvalidTokenError(): void;
}
