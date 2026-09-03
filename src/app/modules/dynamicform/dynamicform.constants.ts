import { ConditionalLogic, DynamicFieldType, DynamicFormField } from './entities/dynamic-form-field';

export interface FieldTypeMeta {
  value: DynamicFieldType;
  label: string;
  icon: string;
  group: string;
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
  { value: 'section_break', label: 'Pemisah Bagian', icon: 'file-sliders', group: 'Tampilan' },
  { value: 'paragraph', label: 'Teks Statis', icon: 'file-text', group: 'Tampilan' },
  { value: 'image', label: 'Gambar', icon: 'book-open', group: 'Tampilan' },
];

export const DISPLAY_FIELD_TYPES: DynamicFieldType[] = ['section_break', 'paragraph', 'image'];
export const OPTION_FIELD_TYPES: DynamicFieldType[] = ['dropdown', 'radio', 'checkbox'];

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
}

export const STATUS_META: StatusMeta[] = [
  { value: 'draft', label: 'Draf', badgeClass: 'badge-muted' },
  { value: 'published', label: 'Dipublikasi', badgeClass: 'badge-success' },
  { value: 'closed', label: 'Ditutup', badgeClass: 'badge-warn' },
  { value: 'archived', label: 'Diarsipkan', badgeClass: 'badge-muted' },
];

export function statusMeta(status: string): StatusMeta {
  return STATUS_META.find((s) => s.value === status) ?? STATUS_META[0];
}

/**
 * evalConditional evaluates a field's conditionalLogic client-side against the
 * current answers map (keyed "field_<id>"). Returns whether the field should be
 * shown. Mirrors the backend's fieldVisible so a hidden field is never required.
 */
export function evalConditional(field: DynamicFormField, answers: Record<string, unknown>): boolean {
  const cl = field.conditionalLogic as ConditionalLogic | null;
  if (!cl || !cl.conditions || cl.conditions.length === 0) return true;

  const matchAll = (cl.match ?? 'all') !== 'any';
  let matched = matchAll;
  for (const c of cl.conditions) {
    const raw = answers[`field_${c.fieldID}`];
    const got = Array.isArray(raw) ? raw.map(String) : [String(raw ?? '')];
    const first = (got[0] ?? '').trim();
    let ok = false;
    switch (c.operator) {
      case 'eq': ok = first === c.value; break;
      case 'neq': ok = first !== c.value; break;
      case 'contains': ok = first.includes(c.value) || got.includes(c.value); break;
      case 'gt': ok = toNum(first) > toNum(c.value); break;
      case 'lt': ok = toNum(first) < toNum(c.value); break;
      case 'filled': ok = first !== ''; break;
      case 'empty': ok = first === ''; break;
    }
    matched = matchAll ? matched && ok : matched || ok;
  }
  return (cl.action ?? 'show') === 'hide' ? !matched : matched;
}

function toNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
