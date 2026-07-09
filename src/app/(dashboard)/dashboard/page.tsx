"use client";

import { useEffect, useState } from "react";
import { Link2, MousePointerClick, BarChart3 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { StatCard } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi } from "@/lib/api";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    analyticsApi.dashboard()
      .then((res) => {
        setData(res.data);
        setError(false);
      })
      .catch(() => {
        setError(true);
        setData(null);
        toast.error("Could not load dashboard data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  const chartData = (data?.clicksLast7Days || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    clicks: d.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">Overview of your shortened links</p>
      </div>

      {error && (
        <p className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Dashboard data is temporarily unavailable. Your links page may still show the correct link count.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Links" value={data?.totalLinks ?? 0} icon={Link2} />
        <StatCard title="Total Clicks" value={data?.totalClicks ?? 0} icon={MousePointerClick} />
        <StatCard title="Top Link Clicks" value={data?.topLinks?.[0]?.clickCount ?? 0} icon={BarChart3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clicks (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="clicks" stroke="#18181b" fill="#18181b" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-zinc-500">No click data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Links</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topLinks && data.topLinks.length > 0 ? (
              <div className="space-y-3">
                {data.topLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <span className="font-mono text-sm">/{link.shortCode}</span>
                    <span className="text-sm font-medium">{link.clickCount} clicks</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-zinc-500">No links yet. Create your first short link!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
