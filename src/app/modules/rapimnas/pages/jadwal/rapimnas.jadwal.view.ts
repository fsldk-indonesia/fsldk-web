import { RapimnasPublic } from '../../entities/rapimnas';

export interface RapimnasJadwalView {
  setData(data: RapimnasPublic): void;
  setLoading(loading: boolean): void;
}
