
export interface LombaTimeline {
  title: string;
  date: string;
}

export interface LombaKategori {
  namaKategori: string;
  temaKategori: string;
  tipePeserta: string;
  biayaPendaftaran: string;
  alurPendaftaran: string[];
  timeline: LombaTimeline[];
}

export interface LombaContactPerson {
  name: string;
  phone: string;
  type: string;
}

export interface RapimnasLombaSetting {
  id: number;
  namaKegiatan: string;
  deskripsi: string;
  benefit: string[];
  persyaratanUmum: string[];
  daftarKategori: LombaKategori[];
  linkGuidebook: string;
  linkPendaftaran: string;
  linkTwibbon: string;
  linkPengumpulanKarya: string;
  linkTemplateBCC: string;
  akunSosmed: string;
  contactPersons: LombaContactPerson[];
  updatedDate: string | null;
}

// PUT mengirim seluruh konfigurasi tanpa metadata database.
export type RapimnasLombaUpdatePayload =
  Omit<RapimnasLombaSetting, 'id' | 'updatedDate'>;

export interface LombaUpdateResult {
  updated: boolean;
}
