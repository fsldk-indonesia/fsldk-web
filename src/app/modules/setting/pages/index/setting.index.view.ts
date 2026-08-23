import { Setting } from '../../entities/setting';

export interface SettingIndexView {
  setSettings(items: Setting[]): void;
  onActionSettled(id: number): void;
}
