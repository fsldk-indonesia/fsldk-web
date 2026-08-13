import { ShortLink } from '../../entities/shortlink';

export interface ShortlinkIndexView {
  setShortlinks(items: ShortLink[], count: number): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
