import { toCanvas } from 'qrcode';

/** Warna default selaras tema sistem (lihat backend qrcode_service). */
export const QR_DEFAULT_FG = '#16211C';
export const QR_DEFAULT_BG = '#FFFFFF';

/** Tautan contoh untuk pratinjau di form pengajuan publik. */
export const QR_PREVIEW_EXAMPLE_URL = 'https://fsldk.or.id';

/** Preset warna QR — dari palet tema FSLDK (src/styles.scss). */
export const QR_FG_SWATCHES: { label: string; value: string }[] = [
  { label: 'Hitam Teks', value: '#16211C' },
  { label: 'Hijau FSLDK', value: '#00933B' },
  { label: 'Hijau Tua', value: '#046428' },
  { label: 'Hijau Pekat', value: '#04371A' },
];

export const QR_BG_SWATCHES: { label: string; value: string }[] = [
  { label: 'Putih', value: '#FFFFFF' },
  { label: 'Krem', value: '#FAFBF8' },
  { label: 'Hijau Muda', value: '#F3FAF5' },
  { label: 'Abu Hijau', value: '#F2F4EF' },
];

/** URL logo FSLDK (transparan) untuk preset ikon "fsldk". */
export const FSLDK_LOGO_URL = '/assets/logo-fsldk-removebg.png';

export type QrIconPreset = 'fsldk' | 'link' | 'browser' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'facebook';

/** Daftar preset ikon tengah untuk tombol pilihan cepat. `icon` = nama di
 *  shared IconComponent (untuk 'fsldk' pakai gambar logo). */
export const QR_ICON_PRESETS: { key: QrIconPreset; label: string; icon: string }[] = [
  { key: 'fsldk', label: 'FSLDK', icon: '' },
  { key: 'link', label: 'Tautan', icon: 'link' },
  { key: 'browser', label: 'Browser', icon: 'globe' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
  { key: 'x', label: 'X', icon: 'x-twitter' },
  { key: 'facebook', label: 'Facebook', icon: 'facebook' },
];

/**
 * Path SVG outline (gaya Tabler Icons, MIT — viewBox 0 0 24 24, stroke-based)
 * untuk glyph preset non-FSLDK. Digambar sebagai stroke berwarna = warna QR.
 */
const GLYPHS: Record<Exclude<QrIconPreset, 'fsldk'>, string[]> = {
  link: [
    'M9 15l6 -6',
    'M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464',
    'M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463',
  ],
  browser: [
    'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18',
    'M3.6 9h16.8',
    'M3.6 15h16.8',
    'M11.5 3a17 17 0 0 0 0 18',
    'M12.5 3a17 17 0 0 1 0 18',
  ],
  instagram: [
    'M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4v-8a4 4 0 0 1 4 -4z',
    'M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z',
    'M16.5 7.5v.01',
  ],
  tiktok: [
    'M21 8a5.5 5.5 0 0 1 -5 -5h-3.5v12.5a2.5 2.5 0 1 1 -4 -2v-3.7a6 6 0 1 0 7.5 5.8v-5.3a9 9 0 0 0 5 1.5z',
  ],
  youtube: [
    'M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4z',
    'M10 9l5 3l-5 3z',
  ],
  x: [
    'M4 4l16 16',
    'M20 4l-16 16',
  ],
  facebook: [
    'M13 21v-8h2.5l.5 -3h-3v-1.5a1.5 1.5 0 0 1 1.5 -1.5h1.5v-3h-2.5a4 4 0 0 0 -4 4v2h-2v3h2v8',
  ],
};

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Menggambar ikon preset ke ctx: kotak pembungkus putih ber-radius, border
 * kotak = warna QR, lalu glyph outline = warna QR (atau logo FSLDK berwarna
 * asli untuk preset 'fsldk'). Dipakai baik untuk pratinjau langsung maupun
 * saat mengomposisi PNG data-URI yang disimpan.
 */
export function drawPresetIcon(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, box: number,
  preset: QrIconPreset, fg: string, fsldkImg: HTMLImageElement | null,
): void {
  const half = box / 2;
  const radius = box * 0.24;
  const border = Math.max(1.5, box * 0.05);

  roundRectPath(ctx, cx - half, cy - half, box, box, radius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = border;
  ctx.strokeStyle = fg;
  ctx.stroke();

  if (preset === 'fsldk') {
    if (fsldkImg && fsldkImg.naturalWidth > 0) {
      const target = box * 0.6;
      const scale = Math.min(target / fsldkImg.naturalWidth, target / fsldkImg.naturalHeight);
      const dw = fsldkImg.naturalWidth * scale;
      const dh = fsldkImg.naturalHeight * scale;
      ctx.drawImage(fsldkImg, cx - dw / 2, cy - dh / 2, dw, dh);
    }
    return;
  }

  const glyph = GLYPHS[preset];
  if (!glyph) return;
  ctx.save();
  const g = box * 0.5;
  ctx.translate(cx - g / 2, cy - g / 2);
  ctx.scale(g / 24, g / 24);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of glyph) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/**
 * Mengomposisi ikon preset jadi PNG data-URI (transparan di luar kotak
 * ber-radius) — nilai inilah yang disimpan di centerIconURL & dibaca backend
 * (loadIcon) untuk ditempel ke gambar QR. Warna sudah dibakar sesuai `fg`.
 */
export function composePresetIconDataUrl(preset: QrIconPreset, fg: string, fsldkImg: HTMLImageElement | null, size = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  // margin ~3% supaya sudut membulat tidak terpotong tepi kanvas
  drawPresetIcon(ctx, size / 2, size / 2, size * 0.94, preset, fg, fsldkImg);
  return canvas.toDataURL('image/png');
}

export interface QrPreviewInput {
  content: string;
  foregroundColor: string;
  backgroundColor: string;
  captionText: string;
  /** Ikon kustom yang sudah dimuat (mode "unggah sendiri"), atau null. */
  iconImg: HTMLImageElement | null;
  /** Preset ikon aktif — digambar langsung, tidak lewat iconImg. */
  preset?: { key: QrIconPreset; fsldkImg: HTMLImageElement | null };
  size?: number;
}

/**
 * Merender pratinjau QR yang dikustomisasi ke sebuah <canvas>, meniru proporsi
 * hasil render server (pkg/qrgen).
 */
export async function renderQrPreview(canvas: HTMLCanvasElement, o: QrPreviewInput): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = o.size ?? 240;
  const fg = o.foregroundColor || QR_DEFAULT_FG;
  const bg = o.backgroundColor || QR_DEFAULT_BG;
  const caption = (o.captionText || '').trim();
  const captionH = caption ? Math.round(size * 0.16) : 0;
  const content = (o.content || '').trim() || QR_PREVIEW_EXAMPLE_URL;
  const hasIcon = !!o.preset || !!o.iconImg;

  canvas.width = size;
  canvas.height = size + captionH;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let qrCanvas: HTMLCanvasElement;
  try {
    qrCanvas = await toCanvas(content, {
      errorCorrectionLevel: hasIcon ? 'H' : 'M',
      margin: 1, width: size, color: { dark: fg, light: bg },
    });
  } catch {
    return;
  }
  ctx.drawImage(qrCanvas, 0, 0, size, size);

  if (o.preset) {
    drawPresetIcon(ctx, size / 2, size / 2, size * 0.2, o.preset.key, fg, o.preset.fsldkImg);
  } else if (o.iconImg && o.iconImg.naturalWidth > 0 && o.iconImg.naturalHeight > 0) {
    const boxT = size * 0.2;
    const scale = Math.min(boxT / o.iconImg.naturalWidth, boxT / o.iconImg.naturalHeight);
    const dw = o.iconImg.naturalWidth * scale;
    const dh = o.iconImg.naturalHeight * scale;
    const padW = dw * 1.06 + 1;
    const padH = dh * 1.06 + 1;
    ctx.fillStyle = bg;
    ctx.fillRect((size - padW) / 2, (size - padH) / 2, padW, padH);
    ctx.drawImage(o.iconImg, (size - dw) / 2, (size - dh) / 2, dw, dh);
  }

  if (caption) {
    ctx.fillStyle = fg;
    ctx.font = `${Math.round(size * 0.052)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(caption, size / 2, size + captionH / 2, size - size / 12);
  }
}
