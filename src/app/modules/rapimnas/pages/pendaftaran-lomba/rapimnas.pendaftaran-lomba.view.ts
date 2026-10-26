import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasPendaftaranLombaView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
