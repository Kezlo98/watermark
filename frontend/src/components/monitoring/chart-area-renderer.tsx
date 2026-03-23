/**
 * Area chart renderer for multi-entity lag display.
 * Per-entity gradients, no stackId (overlapping for direct comparison).
 */

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { entityDataKey } from "./chart-data-merger";
import type { ChartEntity } from "./chart-entity-types";
import { CHART_COLORS, type TimeWindow } from "./chart-entity-types";
import { generateTicks, formatTimestamp, formatLag } from "./chart-axis-helpers";

interface VisibleEntity extends ChartEntity {
  originalIndex: number;
}

interface ChartAreaRendererProps {
  data: Record<string, unknown>[];
  entities: VisibleEntity[];
  allEntities: ChartEntity[];
  timeWindow: TimeWindow;
}

function buildChartConfig(allEntities: ChartEntity[]): ChartConfig {
  const config: ChartConfig = {};
  allEntities.forEach((entity, i) => {
    config[entityDataKey(i)] = {
      label: entity.name,
      color: CHART_COLORS[entity.colorIndex],
    };
  });
  return config;
}

export function ChartAreaRenderer({
  data,
  entities,
  allEntities,
  timeWindow,
}: ChartAreaRendererProps) {
  const chartConfig = buildChartConfig(allEntities);
  const ticks = useMemo(() => generateTicks(data, timeWindow), [data, timeWindow]);

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <defs>
          {entities.map((entity) => {
            const key = entityDataKey(entity.originalIndex);
            return (
              <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.4} />
                <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.05} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis
          dataKey="timestamp"
          ticks={ticks}
          tickFormatter={(t) => formatTimestamp(t, timeWindow)}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={formatLag}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
          }
        />
        {entities.map((entity) => {
          const key = entityDataKey(entity.originalIndex);
          return (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              fill={`url(#fill-${key})`}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              connectNulls
              activeDot={{ r: 4 }}
              dot={data.length === 1 ? { r: 4, fill: `var(--color-${key})` } : false}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}
