"use client";

/**
 * Tiny zero-dependency SVG charts for Kasa analytics.
 * Designed for the Dayframe calm aesthetic — thin strokes, muted fills, tabular nums.
 */

import { useMemo } from "react";
import { cn } from "@/lib/cn";

// ---------------- Line / Area chart ----------------

export interface LineSeriesPoint {
  x: string; // label (date)
  y: number;
}

export interface LineSeries {
  key: string;
  color: string;
  label: string;
  points: LineSeriesPoint[];
  area?: boolean;
  dashed?: boolean;
}

export function LineChart({
  series,
  height = 220,
  formatY,
  className,
}: {
  series: LineSeries[];
  height?: number;
  formatY?: (n: number) => string;
  className?: string;
}) {
  const PAD_L = 44;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const W = 720; // viewBox width; SVG scales responsively
  const H = height;

  const allPoints = series.flatMap((s) => s.points);
  const hasPoints = allPoints.length > 0;

  const minY = hasPoints ? Math.min(0, ...allPoints.map((p) => p.y)) : 0;
  const maxY = hasPoints ? Math.max(...allPoints.map((p) => p.y), 1) : 1;
  const xs = series[0]?.points.map((p) => p.x) ?? [];

  const yTicks = useMemo(() => {
    const range = maxY - minY || 1;
    const step = niceStep(range / 4);
    const ticks: number[] = [];
    let v = Math.ceil(minY / step) * step;
    while (v <= maxY) {
      ticks.push(v);
      v += step;
    }
    return ticks;
  }, [minY, maxY]);

  if (!hasPoints) {
    return <div className="text-sm text-[color:var(--color-fg-subtle)] py-8 text-center">—</div>;
  }

  const xToPx = (i: number) => {
    if (xs.length <= 1) return PAD_L + (W - PAD_L - PAD_R) / 2;
    return PAD_L + (i / (xs.length - 1)) * (W - PAD_L - PAD_R);
  };
  const yToPx = (v: number) => {
    const range = maxY - minY || 1;
    return PAD_T + (1 - (v - minY) / range) * (H - PAD_T - PAD_B);
  };

  const xLabelStep = Math.max(1, Math.ceil(xs.length / 6));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      role="img"
    >
      {/* Y grid lines */}
      {yTicks.map((t) => {
        const y = yToPx(t);
        return (
          <g key={`y-${t}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="2 4"
              opacity={0.65}
            />
            <text
              x={PAD_L - 8}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-fg-subtle)"
              fontFamily="Inter, sans-serif"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatY ? formatY(t) : abbreviate(t)}
            </text>
          </g>
        );
      })}

      {/* X labels */}
      {xs.map((x, i) =>
        i % xLabelStep === 0 ? (
          <text
            key={`x-${i}`}
            x={xToPx(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--color-fg-subtle)"
            fontFamily="Inter, sans-serif"
          >
            {x.length === 10 ? x.slice(5) : x}
          </text>
        ) : null,
      )}

      {/* Series */}
      {series.map((s) => {
        const path = s.points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(i)} ${yToPx(p.y)}`)
          .join(" ");
        const areaPath = s.area
          ? `${path} L ${xToPx(s.points.length - 1)} ${yToPx(0)} L ${xToPx(0)} ${yToPx(0)} Z`
          : null;
        return (
          <g key={s.key}>
            {areaPath && <path d={areaPath} fill={s.color} opacity={0.12} />}
            <path
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? "4 4" : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ---------------- Donut chart ----------------

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSubLabel,
  className,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  className?: string;
}) {
  const total = slices.reduce((a, b) => a + b.value, 0);
  if (total <= 0) {
    return (
      <div className="text-sm text-[color:var(--color-fg-subtle)] py-8 text-center">
        —
      </div>
    );
  }
  const radius = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <div className={cn("inline-flex items-center justify-center relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={thickness}
        />
        {slices.map((s) => {
          const frac = s.value / total;
          const len = frac * circ;
          const dasharray = `${len} ${circ - len}`;
          const dashoffset = circ * 0.25 - offset; // start at 12 o'clock
          offset += len;
          return (
            <circle
              key={s.key}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      {(centerLabel || centerSubLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerLabel && (
            <div className="text-base font-semibold tabular-nums">{centerLabel}</div>
          )}
          {centerSubLabel && (
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
              {centerSubLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Bar chart (horizontal) ----------------

export interface HBar {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function HorizontalBars({
  bars,
  formatValue,
  max,
  className,
}: {
  bars: HBar[];
  formatValue?: (n: number) => string;
  max?: number;
  className?: string;
}) {
  const top = max ?? Math.max(...bars.map((b) => b.value), 1);
  return (
    <ul className={cn("space-y-2", className)}>
      {bars.map((b) => {
        const pct = (b.value / top) * 100;
        return (
          <li key={b.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: b.color }}
                />
                <span className="truncate">{b.label}</span>
              </span>
              <span className="tabular-nums text-[color:var(--color-fg-muted)]">
                {formatValue ? formatValue(b.value) : b.value.toFixed(0)}
              </span>
            </div>
            <div className="h-1.5 bg-[color:var(--color-surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(2, pct))}%`,
                  background: b.color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------- helpers ----------------

function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const r = raw / base;
  let step;
  if (r < 1.5) step = 1;
  else if (r < 3) step = 2;
  else if (r < 7) step = 5;
  else step = 10;
  return step * base;
}

function abbreviate(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toFixed(0);
}
