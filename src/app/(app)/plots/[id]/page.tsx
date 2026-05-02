import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { GeofenceMap } from "@/components/geofence-map";
import { PlotDocuments } from "@/components/plot-documents";
import { PlotStagesPanel } from "@/components/plot-stages-panel";
import { ChevronLeft } from "lucide-react";
import { formatEgp, formatNumber } from "@/lib/utils";

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info"> = {
  available: "info",
  reserved: "warning",
  sold: "success",
  in_development: "secondary",
};

export default async function PlotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plotId = Number(id);

  const [plot] = await db.select().from(schema.plots).where(eq(schema.plots.id, plotId));
  if (!plot) notFound();

  const [land] = await db.select().from(schema.lands).where(eq(schema.lands.id, plot.landId));
  const owner = plot.ownerId
    ? (await db.select().from(schema.people).where(eq(schema.people.id, plot.ownerId)))[0]
    : null;

  const cost = Number(plot.costEgp);
  const selling = Number(plot.sellingPriceEgp);
  const profitPct =
    plot.profitPercentage !== null
      ? Number(plot.profitPercentage)
      : cost > 0
      ? ((selling - cost) / cost) * 100
      : null;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/plots">
          <ChevronLeft className="h-4 w-4" /> Back to Plots
        </Link>
      </Button>
      <PageHeader
        title={plot.name}
        description={
          <>
            <Link href={`/lands/${land?.id}`} className="underline-offset-2 hover:underline">
              {land?.name}
            </Link>
            {owner ? ` · Owner: ${owner.name}` : ""}
          </>
        }
        action={<Badge variant={statusVariant[plot.status]}>{plot.status.replace("_", " ")}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Area" value={`${formatNumber(plot.areaAcres, 4)} acres`} />
        <Stat label="Cost" value={formatEgp(plot.costEgp)} />
        <Stat label="Selling" value={formatEgp(plot.sellingPriceEgp)} />
        <Stat
          label="Profit"
          value={formatEgp(selling - cost)}
          accent={selling - cost >= 0 ? "text-emerald-700" : "text-rose-700"}
        />
        <Stat
          label="Profit %"
          value={profitPct !== null ? `${formatNumber(profitPct, 2)}%` : "—"}
        />
      </div>

      <Tabs defaultValue="stages">
        <TabsList>
          <TabsTrigger value="stages">Stages & Finance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="map">Geofence</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="stages">
          <Card>
            <CardContent className="p-4">
              <PlotStagesPanel
                plotId={plotId}
                costEgp={cost}
                sellingPriceEgp={selling}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-4">
              <PlotStagesPanel
                plotId={plotId}
                costEgp={cost}
                sellingPriceEgp={selling}
                analyticsOnly
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardContent className="p-4">
              <GeofenceMap plotId={plotId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-4">
              <PlotDocuments plotId={plotId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Field label="Land">{land?.name}</Field>
              <Field label="Owner">{owner?.name || "—"}</Field>
              {owner?.phone && <Field label="Owner Phone">{owner.phone}</Field>}
              {owner?.email && <Field label="Owner Email">{owner.email}</Field>}
              <Field label="Notes">
                <span className="whitespace-pre-wrap">{plot.notes || "—"}</span>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
