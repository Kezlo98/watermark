/**
 * Bar chart renderer for multi-entity lag display.
 */

import { useMemo } from "react";
import {
  Bar,
  BarChart,
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

interface ChartBarRendererProps {
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

export function ChartBarRenderer({
  data,
  entities,
  allEntities,
  timeWindow,
}: ChartBarRendererProps) {
  const chartConfig = buildChartConfig(allEntities);
  const ticks = useMemo(() => generateTicks(data, timeWindow), [data, timeWindow]);

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
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
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={[2, 2, 0, 0]}
            />
          );
        })}
      </BarChart>
    </ChartContainer>
  );
}
