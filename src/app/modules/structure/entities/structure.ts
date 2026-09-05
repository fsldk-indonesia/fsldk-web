export interface Structure {
  structureID: number;
  batch: string;
  period: string;
  structureName: string;
  structureDescription: string;
  logoImage: string | null;
  structureImage: string | null;
  createdDate: string;
}

export interface StructureCreateReq {
  batch: string;
  period: string;
  structureName: string;
  structureDescription: string;
  logoImage: string;
  structureImage: string;
}

export interface StructureUpdateReq {
  batch: string;
  period: string;
  structureName: string;
  structureDescription: string;
  logoImage?: string;
  structureImage?: string;
}
