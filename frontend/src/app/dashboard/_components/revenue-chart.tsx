"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import {
  formatCurrency,
  type RevenuePoint,
} from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const BRAND = "#2d5843";
const CUMULATIVE = "#0ea5e9";

type ChartRow = RevenuePoint & { cumulative: number };

type Props = {
  data: RevenuePoint[];
  className?: string;
};

function formatYTick(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `₹${v}`;
}

export function RevenueChart({ data, className }: Props) {
  const { t } = useI18n();
  const chartData = useMemo<ChartRow[]>(() => {
    let c = 0;
    return data.map((d) => {
      c += d.value;
      return { ...d, cumulative: c };
    });
  }, [data]);

  const maxDay = useMemo(
    () => Math.max(1, ...chartData.map((d) => d.value)),
    [chartData],
  );
  const maxCum = useMemo(
    () => Math.max(1, ...chartData.map((d) => d.cumulative)),
    [chartData],
  );

  const yDayDomain: [number, number] = [0, Math.ceil(maxDay * 1.1)];
  const yCumDomain: [number, number] = [0, Math.ceil(maxCum * 1.06)];

  return (
    <Card
      className={cn(
        "flex min-h-[340px] flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-4 pt-5 shadow-card-soft dark:shadow-none",
        "ring-1 ring-border/50",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("revenue.chartTitle")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("revenue.chartSubtitle")}
          </p>
        </div>
      </header>

      <div className="min-h-[260px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 6"
              vertical={false}
              className="stroke-border/80"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              yAxisId="day"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYTick}
              width={48}
              domain={yDayDomain}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              yAxisId="run"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYTick}
              width={48}
              domain={yCumDomain}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "hsl(160 8% 50% / 0.08)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]!.payload as ChartRow;
                return (
                  <div
                    className="rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-md"
                    style={{ boxShadow: "var(--shadow-card-soft)" }}
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {row.iso}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {t("revenue.legendDaily")}: {formatCurrency(row.value)}
                    </p>
                    <p className="text-xs text-sky-600 tabular-nums dark:text-sky-400">
                      {t("revenue.legendCumulative")}:{" "}
                      {formatCurrency(row.cumulative)}
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
              formatter={(value) => (
                <span className="text-muted-foreground">{value}</span>
              )}
            />
            <Bar
              yAxisId="day"
              dataKey="value"
              name={t("revenue.legendDaily")}
              fill={BRAND}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="run"
              type="monotone"
              dataKey="cumulative"
              name={t("revenue.legendCumulative")}
              stroke={CUMULATIVE}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: CUMULATIVE, stroke: "var(--card)", strokeWidth: 1.5 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
