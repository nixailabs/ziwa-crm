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
import { formatEgp, formatNumber, formatDate } from "@/lib/utils";

type Land = {
  id: number;
  name: string;
  location: string | null;
  area_acres: string;
  purchase_price_egp: string;
  purchase_date: string | null;
  plot_count: number;
  plotted_acres: string | null;
  created_at: string;
};

const empty = {
  name: "",
  location: "",
  areaAcres: "",
  purchasePriceEgp: "",
  purchaseDate: "",
  notes: "",
};

export default function LandsPage() {
  const [rows, setRows] = useState<Land[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/lands");
    if (res.ok) setRows(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Land added");
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
        title="Lands"
        description="Land parcels purchased in acres"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Add Land
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Land</DialogTitle>
              </DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                    <Label>Purchase Price (EGP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.purchasePriceEgp}
                      onChange={(e) =>
                        setForm({ ...form, purchasePriceEgp: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) =>
                      setForm({ ...form, purchaseDate: e.target.value })
                    }
                  />
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Area (acres)</TableHead>
                <TableHead>Plotted</TableHead>
                <TableHead>Plots</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    No lands yet. Add your first land parcel.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.location || "—"}</TableCell>
                  <TableCell>{formatNumber(l.area_acres, 4)}</TableCell>
                  <TableCell>{formatNumber(l.plotted_acres ?? 0, 4)}</TableCell>
                  <TableCell>{l.plot_count}</TableCell>
                  <TableCell>{formatEgp(l.purchase_price_egp)}</TableCell>
                  <TableCell>{formatDate(l.purchase_date)}</TableCell>
                  <TableCell>
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/lands/${l.id}`}>
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
