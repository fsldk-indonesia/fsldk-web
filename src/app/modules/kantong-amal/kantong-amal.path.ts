export const kantongAmalPath = {
  list: '/kantong-amal',
  detail: (slug: string) => `/kantong-amal/${slug}`,
  donate: (slug: string) => `/kantong-amal/${slug}/donasi`,
  paymentStatus: (publicRef: string) => `/kantong-amal/donasi/${publicRef}/status`,
  receipt: (publicRef: string) => `/kantong-amal/donasi/${publicRef}/bukti`,
};
