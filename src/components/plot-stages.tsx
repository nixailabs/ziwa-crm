"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatEgp } from "@/lib/utils";

type Stage = {
  id: number;
  name: string;
  description: string | null;
  status: "planned" | "in_progress" | "completed" | "on_hold";
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
};

type Financial = {
  id: number;
  stageId: number;
  kind: "expense" | "income";
  category: string | null;
  description: string | null;
  amountEgp: string;
  transactionDate: string;
};

const stageVariant = {
  planned: "secondary",
  in_progress: "info",
  completed: "success",
  on_hold: "warning",
} as const;

export function PlotStages({
  plotId,
  onChanged,
}: {
  plotId: number;
  onChanged?: () => void;
}) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "planned" as Stage["status"],
    startDate: "",
    endDate: "",
  });

  async function load() {
    const r = await fetch(`/api/plots/${plotId}/stages`);
    if (r.ok) setStages(await r.json());
  }
  useEffect(() => {
    load();
  }, [plotId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/plots/${plotId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: stages.length }),
    });
    if (res.ok) {
      toast.success("Stage added");
      setOpen(false);
      setForm({
        name: "",
        description: "",
        status: "planned",
        startDate: "",
        endDate: "",
      });
      load();
      onChanged?.();
    }
  }

  async function removeStage(id: number) {
    if (!confirm("Delete this stage and all its financials?")) return;
    const r = await fetch(`/api/stages/${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Deleted");
      load();
      onChanged?.();
    }
  }

  async function changeStatus(id: number, status: Stage["status"]) {
    await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    onChanged?.();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Track development progress in stages. Each stage has its own financial
          ledger.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add stage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add stage</DialogTitle>
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
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as Stage["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stages.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          No stages yet
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map((s) => (
            <StageRow
              key={s.id}
              stage={s}
              onDelete={() => removeStage(s.id)}
              onStatusChange={(v) => changeStatus(s.id, v)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StageRow({
  stage,
  onDelete,
  onStatusChange,
  onChanged,
}: {
  stage: Stage;
  onDelete: () => void;
  onStatusChange: (s: Stage["status"]) => void;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fins, setFins] = useState<Financial[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    kind: "expense" as Financial["kind"],
    category: "",
    description: "",
    amountEgp: "",
    transactionDate: new Date().toISOString().slice(0, 10),
  });

  async function loadFins() {
    const r = await fetch(`/api/stages/${stage.id}/financials`);
    if (r.ok) setFins(await r.json());
  }
  useEffect(() => {
    if (open) loadFins();
  }, [open, stage.id]);

  async function addFin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/stages/${stage.id}/financials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Recorded");
      setAdding(false);
      setForm({
        kind: "expense",
        category: "",
        description: "",
        amountEgp: "",
        transactionDate: new Date().toISOString().slice(0, 10),
      });
      loadFins();
      onChanged?.();
    }
  }

  async function removeFin(id: number) {
    if (!confirm("Delete entry?")) return;
    const r = await fetch(`/api/stages/${stage.id}/financials?finId=${id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      loadFins();
      onChanged?.();
    }
  }

  const expenses = fins
    .filter((f) => f.kind === "expense")
    .reduce((s, f) => s + Number(f.amountEgp), 0);
  const income = fins
    .filter((f) => f.kind === "income")
    .reduce((s, f) => s + Number(f.amountEgp), 0);

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 p-3">
        <button onClick={() => setOpen(!open)} className="text-muted-foreground">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1">
          <div className="font-medium">{stage.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(stage.startDate)} → {formatDate(stage.endDate)}
            {stage.description ? ` · ${stage.description}` : ""}
          </div>
        </div>
        <Select value={stage.status} onValueChange={(v) => onStatusChange(v as Stage["status"])}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant={stageVariant[stage.status]}>{stage.status.replace("_", " ")}</Badge>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="border-t p-3 space-y-3 bg-muted/20">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Expenses</div>
              <div className="font-semibold text-rose-700">{formatEgp(expenses)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Income</div>
              <div className="font-semibold text-emerald-700">{formatEgp(income)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net</div>
              <div className="font-semibold">{formatEgp(income - expenses)}</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="font-medium text-sm">Financial entries</div>
            <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
              <Plus className="h-4 w-4" /> Add entry
            </Button>
          </div>

          {adding && (
            <form
              onSubmit={addFin}
              className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 rounded-md border bg-background"
            >
              <Select
                value={form.kind}
                onValueChange={(v) => setForm({ ...form, kind: v as Financial["kind"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                className="md:col-span-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Amount EGP"
                value={form.amountEgp}
                onChange={(e) => setForm({ ...form, amountEgp: e.target.value })}
                required
              />
              <Input
                type="date"
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                required
              />
              <Button type="submit" className="md:col-span-6">
                Save entry
              </Button>
            </form>
          )}

          {fins.length === 0 ? (
            <div className="text-sm text-muted-foreground">No financial entries yet.</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {fins.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="p-2">{formatDate(f.transactionDate)}</td>
                      <td className="p-2">
                        <Badge
                          variant={f.kind === "income" ? "success" : "destructive"}
                        >
                          {f.kind}
                        </Badge>
                      </td>
                      <td className="p-2">{f.category || "—"}</td>
                      <td className="p-2">{f.description || "—"}</td>
                      <td className="p-2 text-right font-medium">
                        {formatEgp(f.amountEgp)}
                      </td>
                      <td className="p-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFin(f.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
