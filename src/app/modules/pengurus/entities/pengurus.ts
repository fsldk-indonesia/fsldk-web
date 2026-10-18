/** Satu baris kader ACTIVE (apa pun role saat ini) dalam scope organisasi
 *  caller — homeOrganizationID/homeOrganizationName SELALU LDK asal
 *  (tidak berubah walau role-nya sudah dipromosikan ke Puskomda/Puskomnas
 *  Verifikator, lihat submission_service_impl.go setPengurusRole di backend). */
export interface PengurusEntry {
  userID: number;
  fullName: string;
  email: string;
  roleName: string;
  homeOrganizationID: number;
  homeOrganizationName: string;
}
