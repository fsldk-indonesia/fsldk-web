import { WelcomePopup } from '../../entities/welcome-popup';

export interface WelcomepopupFormView {
  setForm(data: WelcomePopup): void;
  setLoading(loading: boolean): void;
  setSaving(saving: boolean): void;
}
