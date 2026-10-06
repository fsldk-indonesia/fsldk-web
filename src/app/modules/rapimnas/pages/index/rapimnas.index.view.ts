import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasIndexView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
