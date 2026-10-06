import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasPendaftaranPesertaView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
