import { ShortLinkPIC } from '../../entities/shortlink-pic';

export interface ShortLinkRequestSubmitView {
  setLoading(loading: boolean): void;
  onSubmitSuccess(): void;
  setPIC(pic: ShortLinkPIC | null): void;
}
