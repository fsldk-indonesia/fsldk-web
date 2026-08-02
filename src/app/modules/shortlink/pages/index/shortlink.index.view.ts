import { ShortLink } from '../../entities/shortlink';

export interface ShortlinkIndexView {
  setShortlinks(items: ShortLink[]): void;
  setSaving(saving: boolean): void;
  onSaveSuccess(): void;
  onRemoveSuccess(): void;
}
