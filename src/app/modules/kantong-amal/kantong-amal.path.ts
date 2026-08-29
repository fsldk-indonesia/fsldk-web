export const kantongAmalPath = {
  list: '/kantong-amal',
  detail: (slug: string) => `/kantong-amal/${slug}`,
  donate: (slug: string) => `/kantong-amal/${slug}/donasi`,
  paymentStatus: (publicRef: string) => `/kantong-amal/donasi/${publicRef}/status`,
  receipt: (publicRef: string) => `/kantong-amal/donasi/${publicRef}/bukti`,

  myCampaigns: '/cms/kantong-amal/campaigns-saya',
  campaignCreate: '/cms/kantong-amal/campaigns-saya/baru',
  campaignEdit: (id: number) => `/cms/kantong-amal/campaigns-saya/${id}/edit`,
  balance: (id: number) => `/cms/kantong-amal/campaigns-saya/${id}/saldo`,
  ledgerHistory: (id: number) => `/cms/kantong-amal/campaigns-saya/${id}/riwayat`,
  withdrawalForm: (id: number) => `/cms/kantong-amal/campaigns-saya/${id}/tarik-saldo`,
  withdrawalHistory: (id: number) => `/cms/kantong-amal/campaigns-saya/${id}/riwayat-penarikan`,
};
