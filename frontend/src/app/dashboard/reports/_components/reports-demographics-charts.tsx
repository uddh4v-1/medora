"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/lib/i18n/provider";
import type { AgeBucket, Demographics } from "@/lib/reports";

import { STRONG } from "./reports-chart-colors";

const PIE = [STRONG, "#0ea5e9", "#94a3b8"];
const BAR = [STRONG, "#3d6b55", "#5c8570", "#7a9a88"];

const AGE_ORDER: AgeBucket[] = ["0–17", "18–35", "36–50", "51+"];

const AGE_I18N: Record<AgeBucket, string> = {
  "0–17": "reports.age.0_17",
  "18–35": "reports.age.18_35",
  "36–50": "reports.age.36_50",
  "51+": "reports.age.51_plus",
} as const;

export function ReportsDemographicsCharts({ d }: { d: Demographics }) {
  const { t } = useI18n();
  const genderData = useMemo(
    () => [
      { key: "m", name: t("reports.gender.male"), value: d.gender.male },
      { key: "f", name: t("reports.gender.female"), value: d.gender.female },
      { key: "u", name: t("reports.gender.unknown"), value: d.gender.unknown },
    ],
    [d.gender, t],
  );
  const ageData = useMemo(
    () =>
      AGE_ORDER.map((k) => ({
        key: k,
        name: t(AGE_I18N[k]),
        value: d.ageBuckets[k],
      })),
    [d.ageBuckets, t],
  );

  const gSum = d.gender.male + d.gender.female + d.gender.unknown;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 dark:bg-muted/10">
        <p className="text-xs font-medium text-foreground">
          {t("reports.genderTitle")}
        </p>
        <div className="mt-3 h-[200px] w-full min-h-[180px]">
          {gSum === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t("reports.noRate")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {genderData.map((_, i) => (
                    <Cell key={genderData[i]!.key} fill={PIE[i % PIE.length]!} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]!.payload as (typeof genderData)[0];
                    return (
                      <div className="rounded-lg border border-border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-muted-foreground">
                          {p.value}
                          {gSum > 0
                            ? ` (${Math.round((p.value / gSum) * 1000) / 10}%)`
                            : null}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {gSum > 0 ? (
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            {genderData.map((g, i) => (
              <li key={g.key} className="flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: PIE[i] }}
                />
                <span>
                  {g.name}{" "}
                  <span className="font-medium text-foreground">
                    {g.value}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 dark:bg-muted/10">
        <p className="text-xs font-medium text-foreground">
          {t("reports.ageTitle")}
        </p>
        <div className="mt-3 min-h-[200px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart
              data={ageData}
              margin={{ top: 10, right: 8, left: 0, bottom: 4 }}
            >
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={0}
              />
              <YAxis
                type="number"
                allowDecimals={false}
                width={32}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(160 8% 50% / 0.08)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]!.payload as (typeof ageData)[0];
                  const atotal =
                    d.ageBuckets["0–17"] +
                    d.ageBuckets["18–35"] +
                    d.ageBuckets["36–50"] +
                    d.ageBuckets["51+"];
                  return (
                    <div className="rounded-lg border border-border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-muted-foreground">
                        {row.value}
                        {atotal > 0
                          ? ` (${Math.round((row.value / atotal) * 1000) / 10}%)`
                          : null}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {ageData.map((_, i) => (
                  <Cell key={ageData[i]!.key} fill={BAR[i % BAR.length]!} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
