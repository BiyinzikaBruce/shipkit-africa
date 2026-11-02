/**
 * ShipKit · phone
 * Normalise East African mobile numbers. Users type "0772 123 456",
 * "+256 772 123456" or "256772123456"; APIs want one exact format.
 *
 *   toE164("0772 123 456")        → "+256772123456"   (SMS: Africa's Talking)
 *   toMsisdn("0772 123 456")      → "256772123456"    (MTN MoMo API partyId)
 *   formatLocal("+256772123456")  → "0772 123 456"    (display)
 *
 * Network detection (MTN vs Airtel…) depends on prefixes that operators change,
 * so `detectNetwork` takes YOUR prefix map. Keep it in config and verify it
 * against your telecom regulator's numbering plan.
 */

export const COUNTRIES = {
  UG: { name: "Uganda", dialCode: "256", nsnLength: 9 },
  KE: { name: "Kenya", dialCode: "254", nsnLength: 9 },
  TZ: { name: "Tanzania", dialCode: "255", nsnLength: 9 },
  RW: { name: "Rwanda", dialCode: "250", nsnLength: 9 },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export interface ParsedPhone {
  country: CountryCode;
  /** National significant number, e.g. "772123456" */
  nsn: string;
}

/** Parse a phone number. Returns null if it isn't a valid number for the country. */
export function parsePhone(input: string, defaultCountry: CountryCode = "UG"): ParsedPhone | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (!/^\d+$/.test(digits)) return null;

  for (const [code, c] of Object.entries(COUNTRIES) as [CountryCode, (typeof COUNTRIES)[CountryCode]][]) {
    if (digits.startsWith(c.dialCode) && digits.length === c.dialCode.length + c.nsnLength) {
      return { country: code, nsn: digits.slice(c.dialCode.length) };
    }
  }
  const c = COUNTRIES[defaultCountry];
  if (digits.startsWith("0") && digits.length === c.nsnLength + 1) return { country: defaultCountry, nsn: digits.slice(1) };
  if (digits.length === c.nsnLength && !digits.startsWith("0")) return { country: defaultCountry, nsn: digits };
  return null;
}

export function isValidPhone(input: string, defaultCountry: CountryCode = "UG"): boolean {
  return parsePhone(input, defaultCountry) !== null;
}

function must(input: string, defaultCountry: CountryCode): ParsedPhone {
  const p = parsePhone(input, defaultCountry);
  if (!p) throw new Error(`Invalid phone number: "${input}"`);
  return p;
}

/** "+256772123456": international with plus (SMS providers). */
export function toE164(input: string, defaultCountry: CountryCode = "UG"): string {
  const p = must(input, defaultCountry);
  return `+${COUNTRIES[p.country].dialCode}${p.nsn}`;
}

/** "256772123456": international without plus (MTN MoMo `partyId`). */
export function toMsisdn(input: string, defaultCountry: CountryCode = "UG"): string {
  return toE164(input, defaultCountry).slice(1);
}

/** "0772 123 456": local display format. */
export function formatLocal(input: string, defaultCountry: CountryCode = "UG"): string {
  const { nsn } = must(input, defaultCountry);
  return `0${nsn.slice(0, 3)} ${nsn.slice(3, 6)} ${nsn.slice(6)}`;
}

/**
 * Detect the mobile network from YOUR prefix map (prefixes of the national number, without the leading 0).
 *   detectNetwork("0772123456", { MTN: ["77", "78"], AIRTEL: ["70", "75"] }) → "MTN"
 */
export function detectNetwork<N extends string>(
  input: string,
  prefixes: Record<N, string[]>,
  defaultCountry: CountryCode = "UG",
): N | null {
  const p = parsePhone(input, defaultCountry);
  if (!p) return null;
  for (const [network, list] of Object.entries(prefixes) as [N, string[]][]) {
    if (list.some((prefix) => p.nsn.startsWith(prefix))) return network;
  }
  return null;
}
