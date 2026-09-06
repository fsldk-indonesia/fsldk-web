import { DynamicFieldType, DynamicFormField, SectionRouting } from './entities/dynamic-form-field';

export interface FieldTypeMeta {
  value: DynamicFieldType;
  label: string;
  icon: string;
  group: string;
  /** Hidden from the palette — added via a dedicated button ("+ Tambah Bagian"). */
  paletteHidden?: boolean;
}

export const FIELD_TYPE_GROUPS = ['Teks', 'Tanggal & Waktu', 'Pilihan', 'Unggahan', 'Tampilan'] as const;

export const FIELD_TYPES: FieldTypeMeta[] = [
  { value: 'short_text', label: 'Teks Singkat', icon: 'file-text', group: 'Teks' },
  { value: 'long_text', label: 'Paragraf', icon: 'file-text', group: 'Teks' },
  { value: 'email', label: 'Email', icon: 'file-text', group: 'Teks' },
  { value: 'number', label: 'Angka', icon: 'file-text', group: 'Teks' },
  { value: 'phone', label: 'Nomor Telepon', icon: 'file-text', group: 'Teks' },
  { value: 'url', label: 'Tautan (URL)', icon: 'link', group: 'Teks' },
  { value: 'date', label: 'Tanggal', icon: 'calendar', group: 'Tanggal & Waktu' },
  { value: 'time', label: 'Waktu', icon: 'calendar', group: 'Tanggal & Waktu' },
  { value: 'datetime', label: 'Tanggal & Waktu', icon: 'calendar', group: 'Tanggal & Waktu' },
  { value: 'dropdown', label: 'Dropdown', icon: 'list-checks', group: 'Pilihan' },
  { value: 'radio', label: 'Pilihan Ganda', icon: 'list-checks', group: 'Pilihan' },
  { value: 'checkbox', label: 'Kotak Centang', icon: 'list-checks', group: 'Pilihan' },
  { value: 'linear_scale', label: 'Skala Linear', icon: 'list-checks', group: 'Pilihan' },
  { value: 'rating', label: 'Rating Bintang', icon: 'list-checks', group: 'Pilihan' },
  { value: 'file', label: 'Unggah Berkas', icon: 'download', group: 'Unggahan' },
  { value: 'paragraph', label: 'Teks Statis', icon: 'file-text', group: 'Tampilan' },
  { value: 'image', label: 'Gambar', icon: 'book-open', group: 'Tampilan' },
  { value: 'video', label: 'Video', icon: 'book-open', group: 'Tampilan' },
  { value: 'section_break', label: 'Bagian', icon: 'file-sliders', group: 'Tampilan', paletteHidden: true },
];

export const DISPLAY_FIELD_TYPES: DynamicFieldType[] = ['section_break', 'paragraph', 'image', 'video'];
export const OPTION_FIELD_TYPES: DynamicFieldType[] = ['dropdown', 'radio', 'checkbox'];
/** Choice types that may carry a fieldConfig.sectionRouting rule. */
export const ROUTING_FIELD_TYPES: DynamicFieldType[] = ['radio', 'dropdown'];

/** linear_scale: minValue is 0 or 1, maxValue is 2..10. rating: 3..10 stars. */
export const LINEAR_SCALE_BOUND = { minLo: 0, minHi: 1, maxLo: 2, maxHi: 10 };
export const RATING_BOUND = { lo: 3, hi: 10 };

export function isDisplayField(t: DynamicFieldType): boolean {
  return DISPLAY_FIELD_TYPES.includes(t);
}

export function fieldTypeLabel(t: DynamicFieldType): string {
  return FIELD_TYPES.find((f) => f.value === t)?.label ?? t;
}

export interface StatusMeta {
  value: string;
  label: string;
  badgeClass: string;
  /** app-icon name for the status-change action button. */
  icon: string;
}

export const STATUS_META: StatusMeta[] = [
  { value: 'draft', label: 'Draf', badgeClass: 'badge-muted', icon: 'file-text' },
  { value: 'published', label: 'Dipublikasi', badgeClass: 'badge-success', icon: 'check-circle' },
  { value: 'closed', label: 'Ditutup', badgeClass: 'badge-warn', icon: 'x-circle' },
];

export function statusMeta(status: string): StatusMeta {
  return STATUS_META.find((s) => s.value === status) ?? STATUS_META[0];
}

/**
 * The single lifecycle transition offered from each status — a linear flow
 * (draft → published → closed → back to draft), mirroring the reference app:
 * a published form only shows "Tutup", a draft only "Terbitkan".
 */
const NEXT_STATUS: Record<string, string> = {
  draft: 'published',
  published: 'closed',
  closed: 'draft',
};

export function nextStatusMeta(status: string): StatusMeta | undefined {
  const next = NEXT_STATUS[status];
  return next ? STATUS_META.find((s) => s.value === next) : undefined;
}

// ---------------------------------------------------------------------------
// Sectioning & routing (client mirror of the backend — techspec Part 2, K1/K3)
// ---------------------------------------------------------------------------

export interface FormSectionView {
  /** fieldID of the section_break that starts this section, 0 for the first. */
  breakFieldID: number;
  /** Section heading — form title for section 0, section_break label otherwise. */
  title: string;
  description: string;
  /** Fields in this section, in order (the section_break itself is excluded). */
  fields: DynamicFormField[];
}

/** Split ordered fields into sections on `section_break`. */
export function buildSections(
  fields: DynamicFormField[],
  formTitle: string,
  formDescription: string,
): FormSectionView[] {
  const ordered = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const sections: FormSectionView[] = [
    { breakFieldID: 0, title: formTitle, description: formDescription, fields: [] },
  ];
  for (const f of ordered) {
    if (f.fieldType === 'section_break') {
      sections.push({
        breakFieldID: f.fieldID,
        title: f.label || 'Bagian',
        description: f.helpText ?? '',
        fields: [],
      });
      continue;
    }
    sections[sections.length - 1].fields.push(f);
  }
  return sections;
}

/**
 * The forward section a routing rule on `sections[cur]` sends the respondent to,
 * or null for a normal fall-through. First answered routing field with a valid
 * forward target wins.
 */
export function sectionRoutingTarget(
  sections: FormSectionView[],
  cur: number,
  answers: Record<string, unknown>,
): number | null {
  const indexByBreak = new Map<number, number>();
  sections.forEach((s, i) => indexByBreak.set(s.breakFieldID, i));

  for (const f of sections[cur].fields) {
    if (!ROUTING_FIELD_TYPES.includes(f.fieldType)) continue;
    const routing = f.fieldConfig?.sectionRouting as SectionRouting | undefined;
    if (!routing?.enabled || !routing.routes?.length) continue;
    const raw = answers[`field_${f.fieldID}`];
    const answer = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
    if (!answer) continue;
    const route = routing.routes.find((r) => r.optionValue === answer);
    if (route) {
      const target = indexByBreak.get(route.targetSectionFieldID);
      if (target != null && target > cur) return target;
    }
  }
  return null;
}

/**
 * Walk the section path the current answers imply and return the indexes of the
 * sections actually reached (forward-only routing).
 */
export function reachableSectionIndexes(
  sections: FormSectionView[],
  answers: Record<string, unknown>,
): Set<number> {
  const reached = new Set<number>();
  for (let cur = 0; cur < sections.length; ) {
    reached.add(cur);
    cur = sectionRoutingTarget(sections, cur, answers) ?? cur + 1;
  }
  return reached;
}
