import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasArsipView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
