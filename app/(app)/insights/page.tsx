"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChannelIcon } from "@/components/channel-badge";
import { SparkArea } from "@/components/charts/spark-area";
import { PageHeader, StatCard } from "@/components/page-header";
import { getAnalytics, type AnalyticsBundle } from "@/lib/api/analytics";
import {
  getFacebookInsights,
  getInstagramInsights,
  listChannels,
  type ChannelInsightsMetric,
} from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import { formatCurrency, formatNumber } from "@/lib/utils";

const pieColors = ["#2563EB", "#60A5FA", "#38BDF8", "#818CF8", "#93C5FD"];

const FACEBOOK_METRIC_LABELS: Record<string, string> = {
  page_media_view: "Media views",
  page_total_media_view_unique: "Unique viewers",
  page_post_engagements: "Post engagements",
  page_views_total: "Page views",
  page_follows: "New follows",
  page_followers_count: "Page followers",
  page_impressions: "Impressions",
  page_impressions_unique: "Reach",
};

const INSTAGRAM_METRIC_LABELS: Record<string, string> = {
  reach: "Reach",
  views: "Views",
  accounts_engaged: "Accounts engaged",
  total_interactions: "Total interactions",
  followers_count: "Followers",
  follows_count: "Following",
  media_count: "Posts",
};

function latestInsightValue(metric: ChannelInsightsMetric): number | null {
  const total = metric.total_value?.value;
  if (typeof total === "number") return total;
  const values = metric.values ?? [];
  if (!values.length) return null;
  const last = values[values.length - 1];
  const raw = last?.value;
  if (typeof raw === "number") return raw;
  if (raw && typeof raw === "object") {
    const sum = Object.values(raw).reduce((acc, item) => acc + (typeof item === "number" ? item : 0), 0);
    return sum || null;
  }
  return null;
}

function metricLabel(metric: ChannelInsightsMetric, platform: "instagram" | "facebook") {
  if (metric.title) return metric.title;
  if (platform === "facebook" && FACEBOOK_METRIC_LABELS[metric.name]) {
    return FACEBOOK_METRIC_LABELS[metric.name];
  }
  if (platform === "instagram" && INSTAGRAM_METRIC_LABELS[metric.name]) {
    return INSTAGRAM_METRIC_LABELS[metric.name];
  }
  return metric.name.replace(/_/g, " ");
}

function InsightsMetricGrid({
  metrics,
  platform,
  emptyText,
  error,
}: {
  metrics: ChannelInsightsMetric[] | null;
  platform: "instagram" | "facebook";
  emptyText: string;
  error?: string | null;
}) {
  if (error) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }
  if (!metrics?.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const value = latestInsightValue(metric);
        return (
          <div key={metric.name} className="rounded-xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metricLabel(metric, platform)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {value !== null ? formatNumber(value) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<AnalyticsBundle | null>(null);
  const [igInsights, setIgInsights] = useState<ChannelInsightsMetric[] | null>(null);
  const [fbInsights, setFbInsights] = useState<ChannelInsightsMetric[] | null>(null);
  const [igConnected, setIgConnected] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);
  const [fbPageName, setFbPageName] = useState<string | null>(null);
  const [igError, setIgError] = useState<string | null>(null);
  const [fbError, setFbError] = useState<string | null>(null);

  useEffect(() => {
    void getAnalytics()
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load insights"));
    void listChannels()
      .then((channels) => {
        const ig = channels.find((c) => c.channel === "instagram" && c.connected);
        const fb = channels.find((c) => c.channel === "facebook" && c.connected);
        const messenger = channels.find((c) => c.channel === "messenger" && c.connected);
        setIgConnected(Boolean(ig));
        setFbConnected(Boolean(fb || messenger));
        setFbPageName(fb?.handle || messenger?.handle || null);

        const tasks: Promise<void>[] = [];
        if (ig) {
          tasks.push(
            getInstagramInsights()
              .then((res) => {
                setIgInsights(res.data ?? []);
                setIgError(null);
              })
              .catch((error) => {
                setIgInsights([]);
                setIgError(error instanceof ApiError ? error.detail : "Could not load Instagram insights");
              }),
          );
        }
        if (fb || messenger) {
          tasks.push(
            getFacebookInsights()
              .then((res) => {
                setFbInsights(res.data ?? []);
                setFbError(null);
              })
              .catch((error) => {
                setFbInsights([]);
                setFbError(error instanceof ApiError ? error.detail : "Could not load Facebook insights");
              }),
          );
        }
        return Promise.all(tasks);
      })
      .catch(() => {
        setIgConnected(false);
        setFbConnected(false);
      });
  }, []);

  const stats = data?.summary;
  const languages = data?.languages ?? [];

  return (
    <div className="page-shell">
      <PageHeader title="Insights" description="Last 7 days · live workspace" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Messages" value={formatNumber(stats?.messages_7d ?? 0)} />
        <StatCard label="Net contacts" value={`+${stats?.net_7d ?? 0}`} />
        <StatCard label="Revenue" value={formatCurrency(stats?.revenue_7d ?? 0)} />
      </div>

      {fbConnected ? (
        <div className="mt-6 glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <ChannelIcon channel="facebook" size={18} />
            <div>
              <h2 className="font-semibold">Facebook Page insights</h2>
              <p className="text-sm text-muted-foreground">
                {fbPageName ? `${fbPageName} · ` : ""}
                Live from Meta Graph API · daily metrics
              </p>
            </div>
          </div>
          <InsightsMetricGrid
            metrics={fbInsights}
            platform="facebook"
            error={fbError}
            emptyText="No Facebook Page insights returned yet. Reconnect the Page with read_insights permission, or check back after activity on your Page."
          />
        </div>
      ) : null}

      {igConnected ? (
        <div className="mt-6 glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <ChannelIcon channel="instagram" size={18} />
            <div>
              <h2 className="font-semibold">Instagram account insights</h2>
              <p className="text-sm text-muted-foreground">Live from Meta Graph API · daily metrics</p>
            </div>
          </div>
          <InsightsMetricGrid
            metrics={igInsights}
            platform="instagram"
            error={igError}
            emptyText="No Instagram insights returned yet. Ensure the connected account is a professional profile with insights enabled."
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-semibold">Messages</h2>
          <SparkArea data={data?.activity ?? []} dataKey="messages" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-semibold">By channel</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.channel_mix ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0.012 230)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-semibold">Languages</h2>
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={languages} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                  {languages.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Conversion events</h2>
          <div className="space-y-3">
            {(data?.conversions ?? []).map((event) => (
              <div key={event.name} className="flex items-center justify-between text-sm">
                <span>{event.name}</span>
                <span className="text-muted-foreground">
                  {event.count}
                  {event.revenue ? ` · ${formatCurrency(event.revenue)}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
