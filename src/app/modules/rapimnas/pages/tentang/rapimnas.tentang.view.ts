import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasTentangView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
