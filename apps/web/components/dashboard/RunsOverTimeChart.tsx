import { cn } from "@/lib/utils";

export type RunsOverTimePoint = {
  iso: string;
  label: string;
  tickLabel: string;
  value: number;
};

type RunsOverTimeChartProps = {
  points: RunsOverTimePoint[];
  className?: string;
  id?: string;
};

const SVG_WIDTH = 720;
const SVG_HEIGHT = 280;
const CHART_PADDING = {
  top: 20,
  right: 18,
  bottom: 30,
  left: 18,
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function RunsOverTimeChart({
  points,
  className,
  id = "dashboard-runs-over-time",
}: RunsOverTimeChartProps) {
  const safePoints =
    points.length > 0
      ? points
      : [{ iso: "today", label: "Today", tickLabel: "Today", value: 0 }];

  const innerWidth = SVG_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = SVG_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const baselineY = SVG_HEIGHT - CHART_PADDING.bottom;
  const maxValue = Math.max(...safePoints.map((point) => point.value), 1);
  const hasData = safePoints.some((point) => point.value > 0);

  const plottedPoints = safePoints.map((point, index) => {
    const x =
      safePoints.length === 1
        ? CHART_PADDING.left + innerWidth / 2
        : CHART_PADDING.left + (index / (safePoints.length - 1)) * innerWidth;
    const y = baselineY - (point.value / maxValue) * innerHeight;

    return { ...point, x, y };
  });

  const linePath = plottedPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${plottedPoints[plottedPoints.length - 1]?.x.toFixed(2)} ${baselineY} L ${plottedPoints[0]?.x.toFixed(2)} ${baselineY} Z`;

  const tickStep = Math.max(1, Math.ceil(plottedPoints.length / 5));
  const visibleTickIndices = new Set(
    plottedPoints
      .map((_, index) => index)
      .filter((index) => index % tickStep === 0 || index === plottedPoints.length - 1)
  );

  const horizontalGridRows = Array.from({ length: 4 }, (_, index) => {
    const y = CHART_PADDING.top + (innerHeight / 3) * index;
    return { id: `row-${index}`, y };
  });

  const yAxisLabels = [
    { value: maxValue, y: CHART_PADDING.top + 4 },
    { value: Math.round(maxValue / 2), y: CHART_PADDING.top + innerHeight / 2 + 4 },
    { value: 0, y: baselineY },
  ].filter(
    (label, index, labels) =>
      labels.findIndex((candidate) => candidate.value === label.value) === index
  );

  const gradientId = `${id}-fill`;
  const strokeId = `${id}-stroke`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-border/80 bg-background/82 p-3 backdrop-blur-sm",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Daily workflow runs over time"
        className="h-[18rem] w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.26)" />
            <stop offset="75%" stopColor="hsl(var(--chart-2) / 0.12)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.02)" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>

        <g aria-hidden="true">
          {horizontalGridRows.map((row) => (
            <line
              key={row.id}
              x1={CHART_PADDING.left}
              x2={SVG_WIDTH - CHART_PADDING.right}
              y1={row.y}
              y2={row.y}
              stroke="hsl(var(--border) / 0.68)"
              strokeDasharray="4 6"
            />
          ))}
          {plottedPoints.map((point, index) =>
            visibleTickIndices.has(index) ? (
              <line
                key={`column-${point.iso}`}
                x1={point.x}
                x2={point.x}
                y1={CHART_PADDING.top}
                y2={baselineY}
                stroke="hsl(var(--border) / 0.3)"
              />
            ) : null
          )}
        </g>

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        {hasData
          ? plottedPoints.map((point, index) => (
              <circle
                key={`point-${point.iso}`}
                cx={point.x}
                cy={point.y}
                r={index === plottedPoints.length - 1 ? 5 : 3.5}
                fill="hsl(var(--background))"
                stroke="hsl(var(--primary))"
                strokeWidth={index === plottedPoints.length - 1 ? 3 : 2}
              />
            ))
          : null}

        {yAxisLabels.map((label) => (
          <text
            key={`label-${label.value}`}
            x={SVG_WIDTH - CHART_PADDING.right}
            y={label.y}
            textAnchor="end"
            dominantBaseline={label.value === 0 ? "auto" : "middle"}
            fill="hsl(var(--muted-foreground) / 0.92)"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.08em"
          >
            {numberFormatter.format(label.value)}
          </text>
        ))}

        {plottedPoints.map((point, index) =>
          visibleTickIndices.has(index) ? (
            <text
              key={`tick-${point.iso}`}
              x={point.x}
              y={SVG_HEIGHT - 8}
              textAnchor={
                index === 0 ? "start" : index === plottedPoints.length - 1 ? "end" : "middle"
              }
              fill="hsl(var(--muted-foreground) / 0.92)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.08em"
            >
              {point.tickLabel}
            </text>
          ) : null
        )}
      </svg>

      {!hasData ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="max-w-xs rounded-sm border border-border/70 bg-background/90 px-4 py-3 shadow-[0_18px_40px_-30px_hsl(var(--foreground)/0.28)] backdrop-blur-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Waiting for activity
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Published flows will start drawing volume here once they receive Telegram events.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
