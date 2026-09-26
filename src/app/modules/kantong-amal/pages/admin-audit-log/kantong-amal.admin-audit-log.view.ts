// Audit log murni read-only (tidak ada create/update/delete) — tidak ada
// state yang perlu didorong presenter ke view di luar apa yang sudah
// ditangani CmsIndexComponent sendiri, jadi kontraknya kosong.
export type KantongAmalAdminAuditLogView = object;
