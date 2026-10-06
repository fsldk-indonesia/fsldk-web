import { RapimnasCms } from '../../entities/rapimnas';

export interface RapimnasCmsSetupView {
  setForm(data: RapimnasCms): void;
  setLoading(loading: boolean): void;
  setSaving(saving: boolean): void;
}
