"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi, urlsApi } from "@/lib/api";
import type { GeoCount, UrlAnalytics, UrlItem } from "@/types";

export default function LinkDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [url, setUrl] = useState<UrlItem | null>(null);
  const [analytics, setAnalytics] = useState<UrlAnalytics | null>(null);
  const [geo, setGeo] = useState<GeoCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const urlRes = await urlsApi.get(id);
        setUrl(urlRes.data);
      } catch {
        setUrl(null);
        return;
      } finally {
        setLoading(false);
      }

      try {
        const [analyticsRes, geoRes] = await Promise.all([
          analyticsApi.urlAnalytics(id),
          analyticsApi.geoAnalytics(id),
        ]);
        setAnalytics(analyticsRes.data);
        setGeo(geoRes.data);
      } catch {
        setAnalyticsError(true);
        toast.error("Could not load analytics data");
      }
    };

    load();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center">Loading...</div>;
  if (!url) return <div className="text-center">Link not found</div>;

  const chartData = (analytics?.clicksByDay || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    clicks: d.count,
  }));

  const geoData = (geo.length > 0 ? geo : analytics?.topCountries || []).map((g) => ({
    name: g.city || g.countryCode || "Unknown",
    count: g.count,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/links"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-mono">/{url.shortCode}</h1>
          <p className="truncate text-zinc-500">{url.longUrl}</p>
        </div>
      </div>

      {analyticsError && (
        <p className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Analytics temporarily unavailable. Click count below may still update after refreshing the links page.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-zinc-500">Total Clicks</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{analytics?.totalClicks ?? url.clickCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-zinc-500">Status</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{url.active ? "Active" : "Inactive"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-zinc-500">Type</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{url.aliasType}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Clicks Over Time</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="clicks" stroke="#18181b" fill="#18181b" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-zinc-500">No clicks recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Geographic Distribution</CardTitle></CardHeader>
          <CardContent>
            {geoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={geoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-zinc-500">No geo data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Clicks</CardTitle></CardHeader>
        <CardContent>
          {analytics?.recentClicks && analytics.recentClicks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">Country</th>
                    <th className="pb-3 font-medium">City</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentClicks.map((click, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-2">{new Date(click.clickedAt).toLocaleString()}</td>
                      <td className="py-2 font-mono text-xs">{click.ipAddress || "-"}</td>
                      <td className="py-2">{click.countryCode || "-"}</td>
                      <td className="py-2">{click.city || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-zinc-500">No recent clicks</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
