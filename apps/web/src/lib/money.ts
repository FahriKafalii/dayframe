const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, locale: string) {
  const key = `${locale}|${currency}`;
  let f = FORMATTERS.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    FORMATTERS.set(key, f);
  }
  return f;
}

export function formatMoney(
  amount: string | number,
  currency = "TRY",
  locale: "tr" | "en" = "tr",
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "—";
  try {
    return formatter(currency, locale).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatMoneySigned(
  amount: string | number,
  currency = "TRY",
  locale: "tr" | "en" = "tr",
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (value > 0) return `+${formatMoney(value, currency, locale)}`;
  return formatMoney(value, currency, locale);
}
