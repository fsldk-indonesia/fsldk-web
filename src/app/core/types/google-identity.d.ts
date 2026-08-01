/** Deklarasi minimal untuk Google Identity Services (dimuat via <script> di index.html). */
interface GoogleIdCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleIdCredentialResponse) => void;
  auto_select?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: GoogleIdConfig): void;
        renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
        prompt(): void;
        cancel(): void;
      };
    };
  };
}
