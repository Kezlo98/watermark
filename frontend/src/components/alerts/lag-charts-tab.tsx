import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
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
import { useKafkaQuery } from "@/hooks/use-kafka-query";
import { useLagTimeSeries } from "@/hooks/use-lag-time-series";
import { useLagAlertsStore } from "@/store/lag-alerts";
import {
  GetAllGroupsLagDetail,
  GetConsumerGroups,
} from "@/lib/wails-client";
import {
  ChartControls,
  type ChartType,
  type TimeWindow,
  type ViewMode,
} from "./chart-controls";
import { BarChart3 } from "lucide-react";
import type { TopicLagSummary } from "@/types/lag-alerts";

const chartConfig: ChartConfig = {
  lag: {
    label: "Lag",
    color: "#3b82f6", // Vibrant blue
  },
};

function formatTimestamp(ts: string, window: string): string {
  const date = new Date(ts);
  if (["1h", "12h", "1d"].includes(window)) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLag(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/** Charts tab — interactive time-series lag charts. */
export function LagChartsTab() {
  const { alertConfig } = useLagAlertsStore();
  const recordingEnabled = alertConfig?.recordingEnabled ?? false;
  const pollInterval = (alertConfig?.pollIntervalSec ?? 30) * 1000;

  const [mode, setMode] = useState<ViewMode>("topic");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("1h");
  const [chartType, setChartType] = useState<ChartType>("area");

  // Fetch entity lists for selector dropdown
  const { data: topicLags } = useKafkaQuery<TopicLagSummary[]>(
    ["all-groups-lag-detail"],
    GetAllGroupsLagDetail as () => Promise<TopicLagSummary[]>,
    { refetchInterval: 30_000 },
  );
  const { data: consumerGroups } = useKafkaQuery(
    ["consumer-groups"],
    GetConsumerGroups,
    { refetchInterval: 30_000 },
  );

  const entities = useMemo(() => {
    if (mode === "topic") {
      return (topicLags ?? []).map((t) => t.topic).sort();
    }
    return (consumerGroups ?? []).map((g) => g.groupId).sort();
  }, [mode, topicLags, consumerGroups]);

  // Fetch time-series data
  const { data: tsData } = useLagTimeSeries({
    mode,
    name: selectedEntity,
    window: timeWindow,
    refreshInterval: pollInterval,
    enabled: recordingEnabled && !!selectedEntity,
  });

  const chartData = useMemo(() => {
    if (!tsData) return [];
    return (tsData as Array<{ timestamp: string; lag: number }>).map((p) => ({
      timestamp: p.timestamp,
      lag: p.lag,
    }));
  }, [tsData]);

  // Handle mode change — reset entity
  const handleModeChange = (m: ViewMode) => {
    setMode(m);
    setSelectedEntity("");
  };

  // Empty states
  if (alertConfig === null) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading configuration...
        </div>
      </div>
    );
  }

  if (!recordingEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <BarChart3 className="size-12 text-slate-600" />
        <div className="text-center space-y-1">
          <p className="text-sm text-slate-400">Chart recording is disabled.</p>
          <p className="text-xs text-slate-500">
            Enable recording in the <span className="text-primary">Config</span> tab to start
            capturing lag data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChartControls
        mode={mode}
        onModeChange={handleModeChange}
        entities={entities}
        selectedEntity={selectedEntity}
        onEntityChange={setSelectedEntity}
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        chartType={chartType}
        onChartTypeChange={setChartType}
      />

      {!selectedEntity ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Select a {mode} to view its lag chart.
        </div>
      ) : chartData.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Recording started — waiting for data...
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillLag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-lag)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-lag)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => formatTimestamp(t, timeWindow)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickFormatter={formatLag}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area
                type="natural"
                dataKey="lag"
                fill="url(#fillLag)"
                stroke="var(--color-lag)"
                strokeWidth={2}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => formatTimestamp(t, timeWindow)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickFormatter={formatLag}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Line
                type="natural"
                dataKey="lag"
                stroke="var(--color-lag)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--color-lag)" }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => formatTimestamp(t, timeWindow)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickFormatter={formatLag}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar
                dataKey="lag"
                fill="var(--color-lag)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      )}
    </div>
  );
}
