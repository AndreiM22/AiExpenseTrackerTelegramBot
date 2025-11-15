"use client";

import type { CategoryBreakdown } from "@/lib/types";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

type Props = {
  breakdown: CategoryBreakdown["categories"];
};

const defaultPalette = [
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#facc15",
  "#c084fc",
  "#f97316",
  "#f87171",
  "#2dd4bf",
];

export function CategoryDonutChart({ breakdown }: Props) {
  const data = breakdown.slice(0, 6);
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const hasData = total > 0 && data.length > 0;
  const paddingAngle = data.length > 1 ? 2 : 0;

  const chartData: CategoryBreakdown["categories"][number][] = hasData
    ? data
    : [
        {
          category_id: "placeholder",
          category_name: "Fără date",
          total: 1,
          count: 0,
          percentage: 0,
          color: undefined,
          icon: undefined,
        },
      ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={[{ value: 1 }]}
          innerRadius={60}
          outerRadius={92}
          isAnimationActive={false}
          dataKey="value"
          fill="rgba(255,255,255,0.06)"
        />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const entry = payload[0].payload;
            return (
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-white backdrop-blur">
                <p className="font-medium">{entry.category_name}</p>
                <p className="text-white/70">
                  {entry.percentage}% • {entry.count} tranzacții
                </p>
              </div>
            );
          }}
        />
        <Pie
          data={chartData}
          innerRadius={60}
          outerRadius={90}
          paddingAngle={paddingAngle}
          dataKey="total"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.category_id}
              fill={
                hasData
                  ? entry.color || defaultPalette[index % defaultPalette.length]
                  : "rgba(255,255,255,0.15)"
              }
              stroke={hasData ? undefined : "rgba(255,255,255,0.2)"}
              className="drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]"
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
