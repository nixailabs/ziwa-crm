"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEgp } from "@/lib/utils";

const COLORS = ["#16a34a", "#f59e0b", "#0ea5e9", "#a855f7", "#ef4444", "#84cc16", "#14b8a6"];

type Analytics = {
  totals: {
    total_expense: string;
    total_income: string;
    expense_count: number;
    income_count: number;
  };
  byStage: { stage_id: number; stage_name: string; status: string; expense: string; income: string }[];
  byMonth: { month: string; expense: string; income: string }[];
  byCategory: { category: string; expense: string }[];
  stages: { total: number; completed: number; in_progress: number; planned: number; on_hold: number };
};

export function PlotAnalytics({
  plotId,
  costEgp,
  sellingPriceEgp,
  refreshKey = 0,
}: {
  plotId: number;
  costEgp: number;
  sellingPriceEgp: number;
  refreshKey?: number;
}) {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`/api/plots/${plotId}/analytics`)
      .then((r) => r.json())
      .then(setData);
  }, [plotId, refreshKey]);

  if (!data) return <div className="text-sm text-muted-foreground">Loading analytics...</div>;

  const stageData = data.byStage.map((s) => ({
    name: s.stage_name,
    expense: Number(s.expense),
    income: Number(s.income),
  }));
  const monthData = data.byMonth.map((m) => ({
    month: m.month,
    expense: Number(m.expense),
    income: Number(m.income),
  }));
  const categoryData = data.byCategory.map((c) => ({
    name: c.category,
    value: Number(c.expense),
  }));

  const totalExpense = Number(data.totals.total_expense);
  const totalIncome = Number(data.totals.total_income);
  const net = totalIncome - totalExpense;
  const projectedProfit = sellingPriceEgp - costEgp;
  const stageProgress =
    data.stages.total > 0
      ? Math.round((data.stages.completed / data.stages.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total expenses" value={formatEgp(totalExpense)} accent="text-rose-700" />
        <Stat label="Total income" value={formatEgp(totalIncome)} accent="text-emerald-700" />
        <Stat
          label="Net"
          value={formatEgp(net)}
          accent={net >= 0 ? "text-emerald-700" : "text-rose-700"}
        />
        <Stat
          label="Projected profit"
          value={formatEgp(projectedProfit)}
          accent={projectedProfit >= 0 ? "text-emerald-700" : "text-rose-700"}
        />
        <Stat label="Stages" value={`${data.stages.completed}/${data.stages.total}`} />
        <Stat label="Stage progress" value={`${stageProgress}%`} />
        <Stat label="Expense entries" value={String(data.totals.expense_count)} />
        <Stat label="Income entries" value={String(data.totals.income_count)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cashflow by month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatEgp(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" />
                  <Line type="monotone" dataKey="income" stroke="#16a34a" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-stage finance</CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatEgp(v)} />
                  <Legend />
                  <Bar dataKey="expense" fill="#ef4444" />
                  <Bar dataKey="income" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label={(e) => `${e.name}: ${formatEgp(e.value)}`}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatEgp(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-semibold mt-1 ${accent || ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Empty() {
  return (
    <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
      No data yet
    </div>
  );
}
