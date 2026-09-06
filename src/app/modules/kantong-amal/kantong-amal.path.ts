export const kantongAmalPath = {
  list: '/kantong-amal',
  detail: (slug: string) => `/kantong-amal/${slug}`,
  donate: (slug: string) => `/kantong-amal/${slug}/donasi`,
  paymentStatus: (publicRef: string) => `/kantong-amal/donasi/${publicRef}/status`,
  receipt: (publicRef: string) => `/kantong-amal/donasi/${publicRef}/bukti`,

  adminCampaigns: '/cms/kantong-amal/campaigns',
  campaignCreate: '/cms/kantong-amal/campaigns/baru',
  campaignEdit: (id: number) => `/cms/kantong-amal/campaigns/${id}/edit`,

  adminDonations: '/cms/kantong-amal/donasi',
  donationCreate: '/cms/kantong-amal/donasi/baru',
  donationEdit: (id: number) => `/cms/kantong-amal/donasi/${id}/edit`,

  adminWithdrawals: '/cms/kantong-amal/penarikan',
  withdrawalCreate: '/cms/kantong-amal/penarikan/baru',
  withdrawalDetail: (id: number) => `/cms/kantong-amal/penarikan/${id}`,
};
