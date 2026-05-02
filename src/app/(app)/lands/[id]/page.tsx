import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { formatEgp, formatNumber, formatDate } from "@/lib/utils";
import { ChevronLeft, ExternalLink } from "lucide-react";

export default async function LandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const landId = Number(id);

  const [land] = await db.select().from(schema.lands).where(eq(schema.lands.id, landId));
  if (!land) notFound();

  const plots = await db
    .select()
    .from(schema.plots)
    .where(eq(schema.plots.landId, landId));

  const plotted = plots.reduce((sum, p) => sum + Number(p.areaAcres), 0);
  const remaining = Number(land.areaAcres) - plotted;

  const totals = await db.execute<{
    cost: string;
    selling: string;
  }>(sql`
    SELECT
      COALESCE(SUM(cost_egp), 0) as cost,
      COALESCE(SUM(selling_price_egp), 0) as selling
    FROM plots WHERE land_id = ${landId}
  `);
  const t = totals.rows[0] || { cost: "0", selling: "0" };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/lands">
          <ChevronLeft className="h-4 w-4" /> Back to Lands
        </Link>
      </Button>
      <PageHeader
        title={land.name}
        description={land.location || "—"}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Area" value={`${formatNumber(land.areaAcres, 4)} acres`} />
        <Stat label="Plotted" value={`${formatNumber(plotted, 4)} acres`} />
        <Stat label="Remaining" value={`${formatNumber(remaining, 4)} acres`} />
        <Stat label="Purchase Price" value={formatEgp(land.purchasePriceEgp)} />
        <Stat label="Plots" value={String(plots.length)} />
        <Stat label="Total Cost" value={formatEgp(t.cost)} />
        <Stat label="Total Selling" value={formatEgp(t.selling)} />
        <Stat label="Purchased" value={formatDate(land.purchaseDate)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plots in this land</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Selling</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No plots yet. Create plots from the Plots page.
                  </TableCell>
                </TableRow>
              )}
              {plots.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{formatNumber(p.areaAcres, 4)} acres</TableCell>
                  <TableCell>{formatEgp(p.costEgp)}</TableCell>
                  <TableCell>{formatEgp(p.sellingPriceEgp)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/plots/${p.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {land.notes && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{land.notes}</CardContent>
        </Card>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
