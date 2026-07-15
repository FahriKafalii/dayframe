"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type {
  KasaBreakdownItemDto,
  KasaDailyPointDto,
  KasaForecastDto,
} from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  DonutChart,
  HorizontalBars,
  LineChart,
  type LineSeries,
} from "@/components/kasa/charts";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { formatMoney } from "@/lib/money";
import { prettyDate, todayIso } from "@/lib/date";
import { cn } from "@/lib/cn";

type RangeKey = "month" | "quarter" | "year";

function rangeBounds(key: RangeKey): { from: string; to: string } {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const to = new Date(now);
  let from: Date;
  if (key === "month") {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else if (key === "quarter") {
    from = new Date(now);
    from.setUTCMonth(from.getUTCMonth() - 2);
    from.setUTCDate(1);
  } else {
    from = new Date(now);
    from.setUTCMonth(from.getUTCMonth() - 11);
    from.setUTCDate(1);
  }
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function KasaAnalyticsPage() {
  const { t, locale } = useT();
  const [range, setRange] = useState<RangeKey>("month");
  const [daily, setDaily] = useState<KasaDailyPointDto[] | null>(null);
  const [breakdown, setBreakdown] = useState<KasaBreakdownItemDto[] | null>(null);
  const [forecast, setForecast] = useState<KasaForecastDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { from, to } = useMemo(() => rangeBounds(range), [range]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [d, b, f] = await Promise.all([
        api.kasa.analytics.daily(from, to),
        api.kasa.analytics.breakdown({ from, to, type: "expense", locale }),
        api.kasa.analytics.forecast({ horizon: 90, lookback: 30 }),
      ]);
      setDaily(d);
      setBreakdown(b);
      setForecast(f);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("kasaAnalytics.loadFailed"));
    }
  }, [from, to, locale, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const baseCurrency = forecast?.base_currency ?? "TRY";
  const fmt = (n: number) => formatMoney(n, baseCurrency, locale);

  // Build line series for income vs expense
  const incomeExpenseSeries = useMemo<LineSeries[]>(() => {
    if (!daily) return [];
    return [
      {
        key: "income",
        label: t("kasa.kpiIncomeMtd"),
        color: "var(--color-success)",
        points: daily.map((d) => ({ x: d.date, y: d.income })),
        area: true,
      },
      {
        key: "expense",
        label: t("kasa.kpiExpenseMtd"),
        color: "var(--color-danger)",
        points: daily.map((d) => ({ x: d.date, y: d.expense })),
        area: true,
      },
    ];
  }, [daily, t]);

  const cumulativeSeries = useMemo<LineSeries[]>(() => {
    if (!daily) return [];
    return [
      {
        key: "cumulative",
        label: t("kasaAnalytics.cumulative"),
        color: "var(--color-accent)",
        points: daily.map((d) => ({ x: d.date, y: d.cumulative_balance })),
        area: true,
      },
    ];
  }, [daily, t]);

  const forecastSeries = useMemo<LineSeries[]>(() => {
    if (!forecast) return [];
    return [
      {
        key: "projected",
        label: t("kasaAnalytics.tabForecast"),
        color: "var(--color-accent)",
        points: forecast.series.map((p) => ({ x: p.date, y: p.projected })),
        area: true,
      },
    ];
  }, [forecast, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("kasaAnalytics.title")}
        description={t("kasaAnalytics.description")}
        actions={
          <div className="flex items-center gap-1 border border-[color:var(--color-border)] rounded-md p-0.5 bg-[color:var(--color-surface)]">
            {(["month", "quarter", "year"] as RangeKey[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-medium transition-colors",
                  range === r
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
                    : "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]",
                )}
              >
                {t(`kasaAnalytics.range${r.charAt(0).toUpperCase() + r.slice(1)}` as never)}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={load}
          retryLabel={t("common.tryAgain")}
        />
      ) : !daily || !breakdown || !forecast ? (
        <LoadingState />
      ) : (
        <>
          {/* Forecast KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label={t("kasaAnalytics.monthEnd")}
              value={
                <span
                  className={cn(
                    forecast.month_end_projected >= 0
                      ? "text-[color:var(--color-success)]"
                      : "text-[color:var(--color-danger)]",
                  )}
                >
                  {fmt(forecast.month_end_projected)}
                </span>
              }
              icon={
                forecast.month_end_projected >= 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )
              }
            />
            <StatCard
              label={t("kasaAnalytics.lowestPoint")}
              value={fmt(forecast.lowest_projected_balance)}
              hint={prettyDate(forecast.lowest_projected_date, locale)}
            />
            <StatCard
              label={t("kasaAnalytics.tabForecast")}
              value={
                <span className="text-[color:var(--color-fg-muted)]">
                  90{" "}
                  {locale === "tr" ? "gün" : "days"}
                </span>
              }
              hint={t("kasaAnalytics.forecastHint")}
            />
          </div>

          {/* Two-up: income vs expense + category donut */}
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t("kasaAnalytics.incomeVsExpense")}</CardTitle>
                  <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">
                    {t("kasaAnalytics.incomeVsExpenseHint")}
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {daily.length === 0 ? (
                  <EmptyState title={t("kasaAnalytics.noData")} />
                ) : (
                  <LineChart
                    series={incomeExpenseSeries}
                    height={240}
                    formatY={(n) => fmt(n)}
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t("kasaAnalytics.categoryDist")}</CardTitle>
                  <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">
                    {t("kasaAnalytics.categoryDistHint")}
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                {breakdown.length === 0 ? (
                  <EmptyState title={t("kasaAnalytics.noData")} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <DonutChart
                        slices={breakdown.slice(0, 8).map((b) => ({
                          key: b.key,
                          label: b.name,
                          value: b.total,
                          color: b.color ?? "var(--color-fg-subtle)",
                        }))}
                        size={180}
                        thickness={22}
                        centerLabel={fmt(
                          breakdown.reduce((a, b) => a + b.total, 0),
                        )}
                        centerSubLabel={t("kasa.kpiExpenseMtd")}
                      />
                    </div>
                    <HorizontalBars
                      bars={breakdown.slice(0, 8).map((b) => ({
                        key: b.key,
                        label: b.name,
                        value: b.total,
                        color: b.color ?? "var(--color-fg-subtle)",
                      }))}
                      formatValue={(n) => fmt(n)}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Cumulative net (history) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{t("kasaAnalytics.cumulative")}</CardTitle>
                <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">
                  {t("kasaAnalytics.cumulativeHint")}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {daily.length === 0 ? (
                <EmptyState title={t("kasaAnalytics.noData")} />
              ) : (
                <LineChart
                  series={cumulativeSeries}
                  height={200}
                  formatY={(n) => fmt(n)}
                />
              )}
            </CardBody>
          </Card>

          {/* Forecast (future) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{t("kasaAnalytics.forecastTitle")}</CardTitle>
                <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">
                  {t("kasaAnalytics.forecastHint")} ·{" "}
                  {prettyDate(todayIso(), locale)} →{" "}
                  {prettyDate(
                    forecast.series[forecast.series.length - 1]?.date ??
                      todayIso(),
                    locale,
                  )}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <LineChart
                series={forecastSeries}
                height={220}
                formatY={(n) => fmt(n)}
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
