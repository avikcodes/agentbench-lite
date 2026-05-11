"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function AccuracyChart({
  data,
}: {
  data: Array<{ name: string; accuracy: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`} />
          <Bar dataKey="accuracy" radius={[12, 12, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyChart({
  data,
}: {
  data: Array<{ name: string; latency: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(2)}s`} />
          <Bar dataKey="latency" radius={[12, 12, 0, 0]} fill="var(--chart-4)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreComparisonChart({
  data,
}: {
  data: Array<{ name: string; score: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
          <Tooltip formatter={(value) => `${(Number(value ?? 0) * 100).toFixed(1)}%`} />
          <Bar dataKey="score" radius={[0, 12, 12, 0]} fill="var(--chart-2)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BenchmarkHistoryChart({
  data,
}: {
  data: Array<{ name: string; score: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => `${(Number(value ?? 0) * 100).toFixed(1)}%`} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#historyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionPieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
            {data.map((_, index) => (
              <Cell key={index} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => Number(value ?? 0)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLineChart({
  data,
  dataKey,
  color = "var(--chart-1)",
  formatter,
}: {
  data: Array<{ name: string; value: number }>;
  dataKey: string;
  color?: string;
  formatter?: (value: number) => string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatter} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => (formatter ? formatter(Number(value ?? 0)) : String(value ?? 0))} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  dataKey,
  color = "var(--chart-2)",
  formatter,
}: {
  data: Array<{ name: string; value: number }>;
  dataKey: string;
  color?: string;
  formatter?: (value: number) => string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis type="number" tickFormatter={formatter} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
          <Tooltip formatter={(value) => (formatter ? formatter(Number(value ?? 0)) : String(value ?? 0))} />
          <Bar dataKey={dataKey} radius={[0, 12, 12, 0]} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiBarChart({
  data,
  keys,
  colors = chartColors,
  formatter,
}: {
  data: Array<Record<string, string | number>>;
  keys: string[];
  colors?: string[];
  formatter?: (value: number) => string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatter} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => (formatter ? formatter(Number(value ?? 0)) : String(value ?? 0))} />
          <Legend />
          {keys.map((key, index) => (
            <Bar key={key} dataKey={key} radius={[4, 4, 0, 0]} fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
