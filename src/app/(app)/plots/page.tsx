"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { formatEgp, formatNumber } from "@/lib/utils";

type Plot = {
  id: number;
  name: string;
  land_id: number;
  land_name: string;
  owner_id: number | null;
  owner_name: string | null;
  area_acres: string;
  cost_egp: string;
  selling_price_egp: string;
  profit_percentage: string | null;
  status: "available" | "reserved" | "sold" | "in_development";
};

type Land = { id: number; name: string };
type Person = { id: number; name: string };

const empty = {
  landId: "",
  ownerId: "",
  name: "",
  areaAcres: "",
  costEgp: "",
  sellingPriceEgp: "",
  profitPercentage: "",
  status: "available" as const,
  notes: "",
};

const statusVariant: Record<string, "secondary" | "success" | "warning" | "info"> = {
  available: "info",
  reserved: "warning",
  sold: "success",
  in_development: "secondary",
};

export default function PlotsPage() {
  const [rows, setRows] = useState<Plot[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [p, l, ppl] = await Promise.all([
      fetch("/api/plots").then((r) => r.json()),
      fetch("/api/lands").then((r) => r.json()),
      fetch("/api/people").then((r) => r.json()),
    ]);
    setRows(p);
    setLands(l);
    setPeople(ppl);
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ownerId: form.ownerId || null,
          profitPercentage: form.profitPercentage || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Plot added");
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Plots"
        description="Plots carved out from your lands"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={lands.length === 0}>
                <Plus className="h-4 w-4" /> Add Plot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Plot</DialogTitle>
              </DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Land *</Label>
                    <Select
                      value={form.landId}
                      onValueChange={(v) => setForm({ ...form, landId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select land" />
                      </SelectTrigger>
                      <SelectContent>
                        {lands.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Owner</Label>
                    <Select
                      value={form.ownerId}
                      onValueChange={(v) => setForm({ ...form, ownerId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Plot A1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Area (acres) *</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={form.areaAcres}
                      onChange={(e) => setForm({ ...form, areaAcres: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm({ ...form, status: v as typeof empty.status })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="in_development">In development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cost (EGP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.costEgp}
                      onChange={(e) => setForm({ ...form, costEgp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Selling (EGP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.sellingPriceEgp}
                      onChange={(e) =>
                        setForm({ ...form, sellingPriceEgp: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Profit %</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={form.profitPercentage}
                      onChange={(e) =>
                        setForm({ ...form, profitPercentage: e.target.value })
                      }
                      placeholder="auto"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {lands.length === 0 && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm">
            You haven&apos;t added any lands yet.{" "}
            <Link href="/lands" className="underline text-primary">
              Add your first land
            </Link>{" "}
            before creating plots.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plot</TableHead>
                <TableHead>Land</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Selling</TableHead>
                <TableHead>Profit %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    No plots yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.land_name}</TableCell>
                  <TableCell>{p.owner_name || "—"}</TableCell>
                  <TableCell>{formatNumber(p.area_acres, 4)}</TableCell>
                  <TableCell>{formatEgp(p.cost_egp)}</TableCell>
                  <TableCell>{formatEgp(p.selling_price_egp)}</TableCell>
                  <TableCell>
                    {p.profit_percentage
                      ? `${formatNumber(p.profit_percentage, 2)}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] || "secondary"}>
                      {p.status.replace("_", " ")}
                    </Badge>
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
    </>
  );
}
