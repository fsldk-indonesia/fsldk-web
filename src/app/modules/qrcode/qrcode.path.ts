export const qrcodePath = {
  index: '/cms/qrcode/list',
  requests: '/cms/qrcode/permintaan',
  ajukan: '/qrcode/ajukan',
  /** Halaman publik detail/unduh satu QR Code. */
  detail: (id: number | string) => `/qr/${id}`,
};
