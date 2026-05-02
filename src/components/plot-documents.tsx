"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Doc = {
  id: number;
  name: string;
  fileUrl: string;
  fileType: string | null;
  notes: string | null;
  uploadedAt: string;
};

export function PlotDocuments({ plotId }: { plotId: number }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", fileUrl: "", fileType: "", notes: "" });

  async function load() {
    const r = await fetch(`/api/plots/${plotId}/documents`);
    if (r.ok) setDocs(await r.json());
  }
  useEffect(() => {
    load();
  }, [plotId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/plots/${plotId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Document added");
      setOpen(false);
      setForm({ name: "", fileUrl: "", fileType: "", notes: "" });
      load();
    } else {
      toast.error("Failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete document?")) return;
    const r = await fetch(`/api/plots/${plotId}/documents?docId=${id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      toast.success("Deleted");
      load();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Attach contracts, deeds, receipts, photos, etc. Provide a link to the file
          (cloud storage, drive, etc.).
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add document</DialogTitle>
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
                <Label>File URL *</Label>
                <Input
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  required
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Input
                  value={form.fileType}
                  onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                  placeholder="contract / deed / photo"
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
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <FileText className="h-5 w-5" />
          No documents yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map((d) => (
            <div key={d.id} className="rounded-md border p-3 flex items-start gap-3">
              <div className="rounded-md bg-muted p-2">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.fileType || "—"} · {formatDate(d.uploadedAt)}
                </div>
                {d.notes && (
                  <div className="text-xs mt-1 text-muted-foreground line-clamp-2">
                    {d.notes}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => remove(d.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
