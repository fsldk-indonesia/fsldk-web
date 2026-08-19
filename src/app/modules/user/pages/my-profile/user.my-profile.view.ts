import { KaderInfo } from '../../../submission/entities/submission';

export interface UserMyProfileView {
  setSaving(saving: boolean): void;
  onChangePasswordSuccess(): void;
  setKader(kader: KaderInfo | null): void;
  setContactSaving(saving: boolean): void;
}
