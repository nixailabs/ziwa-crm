import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEgp, formatNumber } from "@/lib/utils";
import { TreePine, Map as MapIcon, Users, Sprout } from "lucide-react";

async function getStats() {
  const r = await db.execute<{
    lands_count: number;
    plots_count: number;
    people_count: number;
    total_acres: string;
    total_cost: string;
    total_selling: string;
    total_expense: string;
    total_income: string;
    sold_count: number;
    available_count: number;
    reserved_count: number;
    development_count: number;
  }>(sql`
    SELECT
      (SELECT COUNT(*) FROM lands)::int as lands_count,
      (SELECT COUNT(*) FROM plots)::int as plots_count,
      (SELECT COUNT(*) FROM people)::int as people_count,
      COALESCE((SELECT SUM(area_acres) FROM lands), 0) as total_acres,
      COALESCE((SELECT SUM(cost_egp) FROM plots), 0) as total_cost,
      COALESCE((SELECT SUM(selling_price_egp) FROM plots), 0) as total_selling,
      COALESCE((SELECT SUM(amount_egp) FROM stage_financials WHERE kind='expense'), 0) as total_expense,
      COALESCE((SELECT SUM(amount_egp) FROM stage_financials WHERE kind='income'), 0) as total_income,
      (SELECT COUNT(*) FROM plots WHERE status='sold')::int as sold_count,
      (SELECT COUNT(*) FROM plots WHERE status='available')::int as available_count,
      (SELECT COUNT(*) FROM plots WHERE status='reserved')::int as reserved_count,
      (SELECT COUNT(*) FROM plots WHERE status='in_development')::int as development_count
  `);
  return r.rows[0];
}

async function getRecentPlots() {
  const r = await db.execute<{
    id: number;
    name: string;
    land_name: string;
    area_acres: string;
    cost_egp: string;
    selling_price_egp: string;
    status: string;
  }>(sql`
    SELECT p.id, p.name, l.name as land_name, p.area_acres, p.cost_egp, p.selling_price_egp, p.status
    FROM plots p JOIN lands l ON l.id = p.land_id
    ORDER BY p.created_at DESC
    LIMIT 6
  `);
  return r.rows;
}

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info"> = {
  available: "info",
  reserved: "warning",
  sold: "success",
  in_development: "secondary",
};

export default async function DashboardPage() {
  const s = await getStats();
  const recent = await getRecentPlots();

  const projectedProfit =
    Number(s?.total_selling || 0) - Number(s?.total_cost || 0);
  const cashflow = Number(s?.total_income || 0) - Number(s?.total_expense || 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of all lands, plots, and finances" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={TreePine} label="Lands" value={String(s?.lands_count || 0)} sub={`${formatNumber(s?.total_acres, 2)} acres`} />
        <KpiCard icon={MapIcon} label="Plots" value={String(s?.plots_count || 0)} sub={`${s?.sold_count || 0} sold`} />
        <KpiCard icon={Users} label="People" value={String(s?.people_count || 0)} sub="Owners & contacts" />
        <KpiCard
          icon={Sprout}
          label="Projected Profit"
          value={formatEgp(projectedProfit)}
          sub={`Cashflow: ${formatEgp(cashflow)}`}
          accent={projectedProfit >= 0 ? "text-emerald-700" : "text-rose-700"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Plot status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatusRow label="Available" count={s?.available_count || 0} variant="info" />
            <StatusRow label="Reserved" count={s?.reserved_count || 0} variant="warning" />
            <StatusRow label="In development" count={s?.development_count || 0} variant="secondary" />
            <StatusRow label="Sold" count={s?.sold_count || 0} variant="success" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Total cost" value={formatEgp(s?.total_cost)} />
            <Row label="Total selling" value={formatEgp(s?.total_selling)} />
            <Row label="Recorded expenses" value={formatEgp(s?.total_expense)} />
            <Row label="Recorded income" value={formatEgp(s?.total_income)} />
            <Row
              label="Net cashflow"
              value={formatEgp(cashflow)}
              accent={cashflow >= 0 ? "text-emerald-700" : "text-rose-700"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/lands">
                <TreePine className="h-4 w-4" /> Add Land
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/plots">
                <MapIcon className="h-4 w-4" /> Add Plot
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/people">
                <Users className="h-4 w-4" /> Add Person
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/plots">
                <Sprout className="h-4 w-4" /> View Plots
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent plots</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">No plots yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  href={`/plots/${p.id}`}
                  className="rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.land_name}</div>
                    </div>
                    <Badge variant={statusVariant[p.status]}>
                      {p.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Area</div>
                      <div>{formatNumber(p.area_acres, 2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost</div>
                      <div>{formatEgp(p.cost_egp)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Selling</div>
                      <div>{formatEgp(p.selling_price_egp)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`text-2xl font-bold mt-1 ${accent || ""}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${accent || ""}`}>{value}</span>
    </div>
  );
}

function StatusRow({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: "secondary" | "success" | "warning" | "info";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Badge variant={variant}>{count}</Badge>
    </div>
  );
}
