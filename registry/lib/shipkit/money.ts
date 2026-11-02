/**
 * ShipKit · money
 * Format and parse money for African currencies. Display-only helpers:
 * do arithmetic with Prisma.Decimal (or integers), never with floats.
 *
 *   formatMoney(1250000, "UGX")        → "UGX 1,250,000"
 *   formatMoney("2499.5", "KES")       → "KES 2,499.50"
 *   formatMoneyShort(1250000, "UGX")   → "UGX 1.3M"
 *   parseMoneyInput("1,250,000")       → "1250000"
 */

export type MoneyInput = number | string | { toString(): string };

export interface FormatMoneyOptions {
  /** BCP 47 locale for digit grouping. Default "en". */
  locale?: string;
  /** Override decimals. Default: the currency's standard (UGX/RWF 0, KES/TZS/USD 2). */
  decimals?: number;
  /** Show the currency code. Default true. */
  showCode?: boolean;
}

function toNumber(amount: MoneyInput): number {
  const n = typeof amount === "number" ? amount : Number(String(amount));
  if (!Number.isFinite(n)) throw new Error(`Invalid money amount: ${String(amount)}`);
  return n;
}

/** Standard number of decimals for a currency (from the runtime's ISO 4217 data). */
export function currencyDecimals(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function formatMoney(amount: MoneyInput, currency = "UGX", options: FormatMoneyOptions = {}): string {
  const { locale = "en", showCode = true } = options;
  const decimals = options.decimals ?? currencyDecimals(currency);
  const n = toNumber(amount);
  const body = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(n));
  const sign = n < 0 ? "-" : "";
  return showCode ? `${sign}${currency} ${body}` : `${sign}${body}`;
}

/** Compact form for KPI cards: 950 → "950", 12_500 → "12.5K", 1_250_000 → "1.3M", 2.1e9 → "2.1B". */
export function formatMoneyShort(amount: MoneyInput, currency = "UGX", options: { showCode?: boolean } = {}): string {
  const n = toNumber(amount);
  const abs = Math.abs(n);
  const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  let body = String(Math.round(abs));
  for (const [size, suffix] of units) {
    if (abs >= size) {
      body = `${(abs / size).toFixed(1).replace(/\.0$/, "")}${suffix}`;
      break;
    }
  }
  const sign = n < 0 ? "-" : "";
  return options.showCode === false ? `${sign}${body}` : `${sign}${currency} ${body}`;
}

/**
 * Parse what a user typed into a money field. Returns a plain decimal string
 * (safe to pass to `new Prisma.Decimal(...)`) or null if it isn't a valid amount.
 * Accepts "1,250,000", "1 250 000", "UGX 25,000", "2499.50". Rejects negatives.
 */
export function parseMoneyInput(input: string, maxDecimals = 2): string | null {
  const cleaned = input.replace(/[A-Za-z\s,]/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  if (frac.length > maxDecimals) return null;
  const normalisedWhole = whole.replace(/^0+(?=\d)/, "");
  return frac ? `${normalisedWhole}.${frac}` : normalisedWhole;
}
