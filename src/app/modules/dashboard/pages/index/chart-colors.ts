// Palet warna chart mengikuti token warna di styles.scss (--color-primary,
// --color-gold, dst.) — di-hardcode sebagai hex karena Chart.js butuh nilai
// warna langsung, bukan var() CSS (sama seperti pola di
// kantong-amal.admin-reports.page.ts). Dipakai bersama oleh dashboard.index
// .page.ts dan NetworkBreakdownChartsComponent supaya kedua chart status
// (Puskomnas & Utama) konsisten warnanya.
export const CHART_COLORS = {
  primary: '#00933b',
  primaryBright: '#3dbe6b',
  gold: '#d99a1f',
  ember: '#c1622e',
  info: '#3573a6',
  muted: '#8a978f',
};

export const STATUS_BUCKET_LABELS = ['Belum Mengisi', 'Menunggu Verifikasi', 'Perlu Revisi', 'Terverifikasi'];
export const STATUS_BUCKET_COLORS = [CHART_COLORS.muted, CHART_COLORS.info, CHART_COLORS.gold, CHART_COLORS.primary];
