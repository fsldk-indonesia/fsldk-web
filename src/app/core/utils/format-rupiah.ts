/** Kelompokkan digit dengan pemisah ribuan titik (mis. 20000 -> "20.000") —
 *  dipakai bersama oleh formatRupiah (tampilan) dan MoneyInputComponent
 *  (input field bermask ribuan) supaya aturan pemformatannya satu sumber. */
export function formatThousands(amount: number): string {
  const rounded = Math.round(amount);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${withSeparators}`;
}

/** Format nominal Rupiah dengan pemisah ribuan titik (mis. "Rp 20.000") —
 *  Intl.NumberFormat locale id-ID tidak diregistrasi di aplikasi ini
 *  (default en-US), jadi diformat manual agar konsisten dengan backend. */
export function formatRupiah(amount: number): string {
  return `Rp ${formatThousands(amount)}`;
}
