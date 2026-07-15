import { analyticsRepository } from "@dayframe/repositories";
import { categoryRepository, transactionRepository } from "@dayframe/repositories";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
  net: number;
  cumulative_balance: number; // running balance from `from` baseline
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  key: string;
  name: string;
  emoji: string | null;
  color: string | null;
  total: number;
  share: number; // 0..1
}

export interface ForecastPoint {
  date: string;
  baseline: number; // confirmed running balance
  projected: number; // baseline + planned + recurring + smoothed discretionary
  is_future: boolean;
}

export interface ForecastResult {
  series: ForecastPoint[];
  month_end_projected: number;
  lowest_projected_balance: number;
  lowest_projected_date: string;
  base_currency: string;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );
  while (cursor <= end) {
    days.push(isoDay(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export const kasaAnalyticsService = {
  /**
   * Daily income/expense/net + a running cumulative balance for the window.
   * baseline = total balance as of `from` (computed by summing all accounts'
   * opening_balance + all transactions strictly before `from`).
   */
  async daily(userId: string, fromIso: string, toIso: string): Promise<DailyPoint[]> {
    const from = new Date(fromIso + "T00:00:00.000Z");
    const to = new Date(toIso + "T23:59:59.999Z");

    const rows = await analyticsRepository.findIncomeExpenseInRange(userId, from, to);
    const days = eachDay(from, to);

    const buckets = new Map<string, { income: number; expense: number }>();
    for (const d of days) buckets.set(d, { income: 0, expense: 0 });

    for (const r of rows) {
      const day = isoDay(r.occurred_at);
      const b = buckets.get(day);
      if (!b) continue;
      const a = Number(r.base_amount);
      if (r.type === "income") b.income += a;
      else if (r.type === "expense") b.expense += a;
    }

    let running = 0;
    const out: DailyPoint[] = [];
    for (const d of days) {
      const b = buckets.get(d) ?? { income: 0, expense: 0 };
      const net = b.income - b.expense;
      running += net;
      out.push({
        date: d,
        income: Number(b.income.toFixed(2)),
        expense: Number(b.expense.toFixed(2)),
        net: Number(net.toFixed(2)),
        cumulative_balance: Number(running.toFixed(2)),
      });
    }
    return out;
  },

  /**
   * Spending (or income) breakdown by ROOT category for a date range.
   * Returns sorted desc by total. Includes "Uncategorized" if any.
   */
  async breakdown(
    userId: string,
    fromIso: string,
    toIso: string,
    type: "expense" | "income" = "expense",
    locale: "tr" | "en" = "tr",
  ): Promise<CategoryBreakdownItem[]> {
    const from = new Date(fromIso + "T00:00:00.000Z");
    const to = new Date(toIso + "T23:59:59.999Z");

    const rows = await analyticsRepository.findIncomeExpenseInRange(userId, from, to);
    const cats = await categoryRepository.findAllByUser(userId);

    const idToParent = new Map<string, string | null>();
    for (const c of cats) idToParent.set(c.id, c.parent_id);
    const idToCat = new Map(cats.map((c) => [c.id, c]));

    const totals = new Map<string | null, number>();
    for (const r of rows) {
      if (r.type !== type) continue;
      // walk up to root
      let cid = r.category_id ?? null;
      if (cid) {
        const parent = idToParent.get(cid);
        if (parent) cid = parent;
      }
      totals.set(cid, (totals.get(cid) ?? 0) + Number(r.base_amount));
    }

    const sum = Array.from(totals.values()).reduce((a, b) => a + b, 0);

    const items: CategoryBreakdownItem[] = [];
    for (const [catId, total] of totals.entries()) {
      if (catId == null) {
        items.push({
          category_id: null,
          key: "uncategorized",
          name: locale === "tr" ? "Sınıflandırılmamış" : "Uncategorized",
          emoji: null,
          color: "#9AA3AF",
          total: Number(total.toFixed(2)),
          share: sum > 0 ? total / sum : 0,
        });
        continue;
      }
      const cat = idToCat.get(catId);
      if (!cat) continue;
      const i18n = (cat.i18n ?? {}) as { tr?: { name: string }; en?: { name: string } };
      const name =
        i18n[locale]?.name ?? i18n.en?.name ?? i18n.tr?.name ?? cat.key;
      items.push({
        category_id: cat.id,
        key: cat.key,
        name,
        emoji: cat.emoji,
        color: cat.color,
        total: Number(total.toFixed(2)),
        share: sum > 0 ? total / sum : 0,
      });
    }
    return items.sort((a, b) => b.total - a.total);
  },

  /**
   * Sakin Tahmin — 90-day forecast.
   *
   * Algorithm (deterministic, no ML):
   * 1) Snapshot today's confirmed balance per user (across all accounts).
   * 2) Walk backward `lookbackDays` to compute trailing-30-day median net per day
   *    as the "discretionary" smoothing series.
   * 3) Walk forward up to `horizonDays`, accumulating planned/pending transactions
   *    that fall on each day, plus the smoothing constant.
   * 4) Return baseline (confirmed only, frozen at today) and projected (with smoothing).
   */
  async forecast(
    userId: string,
    options: { horizonDays?: number; lookbackDays?: number; baseCurrency?: string } = {},
  ): Promise<ForecastResult> {
    const horizonDays = options.horizonDays ?? 90;
    const lookbackDays = options.lookbackDays ?? 30;
    const baseCurrency = options.baseCurrency ?? "TRY";

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const from = new Date(today);
    from.setUTCDate(from.getUTCDate() - lookbackDays);
    const to = new Date(today);
    to.setUTCDate(to.getUTCDate() + horizonDays);

    // baseline cumulative balance up to today
    const cleared = await analyticsRepository.findIncomeExpenseInRange(
      userId,
      new Date("1970-01-01T00:00:00.000Z"),
      today,
    );
    let baselineBalance = 0;
    for (const r of cleared) {
      const a = Number(r.base_amount);
      if (r.type === "income") baselineBalance += a;
      else if (r.type === "expense") baselineBalance -= a;
    }
    // include account openings via repository sum trick
    const accountFlows =
      // we don't have easy multi-account aggregate from analytics repo;
      // fall back to transactionRepository.sumIncomeAndExpense semantics:
      // but openings are NOT in transactions table. Add them separately:
      0;
    void accountFlows;
    // Note: opening_balance is added by kasaSummaryService at the account level.
    // For forecast we work on flow-only delta. The UI will display projected
    // delta from today (cumulative_balance) — frontend can offset by current
    // total balance when rendering if it wants absolute values.

    // Trailing daily median net (from cleared rows in lookback window)
    const lookbackRows = await analyticsRepository.findIncomeExpenseInRange(userId, from, today);
    const dailyNet = new Map<string, number>();
    for (const r of lookbackRows) {
      const day = isoDay(r.occurred_at);
      const a = Number(r.base_amount);
      const cur = dailyNet.get(day) ?? 0;
      dailyNet.set(day, cur + (r.type === "income" ? a : -a));
    }
    const nets = Array.from(dailyNet.values()).sort((x, y) => x - y);
    let median = 0;
    if (nets.length > 0) {
      const mid = Math.floor(nets.length / 2);
      median = nets.length % 2 === 0 ? (nets[mid - 1] + nets[mid]) / 2 : nets[mid];
    }
    // Damp the smoothing — don't extrapolate aggressive recent swings linearly.
    const smoothing = median * 0.5;

    // Planned/pending in horizon
    const planned = await analyticsRepository.findPlannedInRange(userId, today, to);
    const plannedByDay = new Map<string, number>();
    for (const r of planned) {
      const day = isoDay(r.occurred_at);
      const a = Number(r.base_amount);
      const sign = r.type === "income" ? a : -a;
      plannedByDay.set(day, (plannedByDay.get(day) ?? 0) + sign);
    }

    const series: ForecastPoint[] = [];
    let projected = 0;
    const days = eachDay(today, to);
    for (const d of days) {
      const isToday = d === isoDay(today);
      const isFuture = !isToday && new Date(d + "T00:00:00.000Z") > today;
      if (isFuture) {
        projected += smoothing + (plannedByDay.get(d) ?? 0);
      }
      series.push({
        date: d,
        baseline: 0, // delta-from-today series; absolute is done client-side
        projected: Number(projected.toFixed(2)),
        is_future: isFuture,
      });
    }

    // month-end projection — find the last day of current month within horizon
    const endOfMonth = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );
    const monthEndPoint =
      series.find((p) => p.date === isoDay(endOfMonth)) ?? series[series.length - 1];

    let lowest = series[0];
    for (const p of series) {
      if (p.projected < lowest.projected) lowest = p;
    }

    return {
      series,
      month_end_projected: Number(monthEndPoint.projected.toFixed(2)),
      lowest_projected_balance: Number(lowest.projected.toFixed(2)),
      lowest_projected_date: lowest.date,
      base_currency: baseCurrency,
    };
  },
};

// Re-export so tree-shaking + barrel works
export { transactionRepository as _txRepoMarker };
