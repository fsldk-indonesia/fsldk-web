export interface WelcomePopup {
  isEnabled: boolean;
  htmlContent: string;
  jsContent: string;
  cssContent: string;
  /** Absen pada respons publik (GET /public/welcome-popup) — dengan sengaja,
   *  lihat welcomepopup_dto.PublicResponse di backend. */
  updatedDate?: string;
}

export interface WelcomePopupUpdatePayload {
  isEnabled: boolean;
  htmlContent: string;
  jsContent: string;
  cssContent: string;
}
