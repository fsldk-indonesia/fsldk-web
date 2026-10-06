import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasPendaftaranPanitiaView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
