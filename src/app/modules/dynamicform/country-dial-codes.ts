/** Country dialing codes for the phone field. Indonesia (+62) is the default. */
export interface CountryDialCode {
  iso: string;
  name: string;
  dial: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso: 'ID', name: 'Indonesia', dial: '+62' },
  { iso: 'MY', name: 'Malaysia', dial: '+60' },
  { iso: 'SG', name: 'Singapore', dial: '+65' },
  { iso: 'BN', name: 'Brunei', dial: '+673' },
  { iso: 'TH', name: 'Thailand', dial: '+66' },
  { iso: 'PH', name: 'Philippines', dial: '+63' },
  { iso: 'VN', name: 'Vietnam', dial: '+84' },
  { iso: 'MM', name: 'Myanmar', dial: '+95' },
  { iso: 'KH', name: 'Cambodia', dial: '+855' },
  { iso: 'LA', name: 'Laos', dial: '+856' },
  { iso: 'TL', name: 'Timor-Leste', dial: '+670' },
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64' },
  { iso: 'CN', name: 'China', dial: '+86' },
  { iso: 'HK', name: 'Hong Kong', dial: '+852' },
  { iso: 'TW', name: 'Taiwan', dial: '+886' },
  { iso: 'JP', name: 'Japan', dial: '+81' },
  { iso: 'KR', name: 'South Korea', dial: '+82' },
  { iso: 'IN', name: 'India', dial: '+91' },
  { iso: 'PK', name: 'Pakistan', dial: '+92' },
  { iso: 'BD', name: 'Bangladesh', dial: '+880' },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94' },
  { iso: 'NP', name: 'Nepal', dial: '+977' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { iso: 'QA', name: 'Qatar', dial: '+974' },
  { iso: 'KW', name: 'Kuwait', dial: '+965' },
  { iso: 'BH', name: 'Bahrain', dial: '+973' },
  { iso: 'OM', name: 'Oman', dial: '+968' },
  { iso: 'JO', name: 'Jordan', dial: '+962' },
  { iso: 'TR', name: 'Turkey', dial: '+90' },
  { iso: 'EG', name: 'Egypt', dial: '+20' },
  { iso: 'MA', name: 'Morocco', dial: '+212' },
  { iso: 'NG', name: 'Nigeria', dial: '+234' },
  { iso: 'ZA', name: 'South Africa', dial: '+27' },
  { iso: 'KE', name: 'Kenya', dial: '+254' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'IE', name: 'Ireland', dial: '+353' },
  { iso: 'DE', name: 'Germany', dial: '+49' },
  { iso: 'FR', name: 'France', dial: '+33' },
  { iso: 'NL', name: 'Netherlands', dial: '+31' },
  { iso: 'BE', name: 'Belgium', dial: '+32' },
  { iso: 'ES', name: 'Spain', dial: '+34' },
  { iso: 'PT', name: 'Portugal', dial: '+351' },
  { iso: 'IT', name: 'Italy', dial: '+39' },
  { iso: 'CH', name: 'Switzerland', dial: '+41' },
  { iso: 'AT', name: 'Austria', dial: '+43' },
  { iso: 'SE', name: 'Sweden', dial: '+46' },
  { iso: 'NO', name: 'Norway', dial: '+47' },
  { iso: 'DK', name: 'Denmark', dial: '+45' },
  { iso: 'FI', name: 'Finland', dial: '+358' },
  { iso: 'PL', name: 'Poland', dial: '+48' },
  { iso: 'RU', name: 'Russia', dial: '+7' },
  { iso: 'UA', name: 'Ukraine', dial: '+380' },
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'MX', name: 'Mexico', dial: '+52' },
  { iso: 'BR', name: 'Brazil', dial: '+55' },
  { iso: 'AR', name: 'Argentina', dial: '+54' },
];

/** Dial codes sorted longest-first, for matching a stored "+<code> <number>" value. */
const DIAL_BY_LENGTH = [...new Set(COUNTRY_DIAL_CODES.map((c) => c.dial))].sort(
  (a, b) => b.length - a.length,
);

/** Split a stored phone value into its dial code and local digits. */
export function splitDialAndNumber(raw: string): { dial: string; number: string } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { dial: '+62', number: '' };

  const spaced = /^(\+\d{1,4})\s+(.*)$/.exec(trimmed);
  if (spaced) return { dial: spaced[1], number: spaced[2].replace(/\D/g, '') };

  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/[^\d+]/g, '');
    for (const dial of DIAL_BY_LENGTH) {
      if (digits.startsWith(dial)) return { dial, number: digits.slice(dial.length) };
    }
  }
  return { dial: '+62', number: trimmed.replace(/\D/g, '') };
}
