"use client";

import { useState } from "react";
import { submitGrievance } from "@/app/actions/grievances";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Plus,
  Eye,
  Calendar,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { GrievanceRow } from "@/types/database";

const CATEGORIES = [
  "Academic & Curriculum",
  "Examination & Results",
  "Hostel & Accommodation",
  "Administrative & Fees",
  "Harassment / Disciplinary",
  "Library & Resources",
  "Infrastructure & Facilities",
  "Other Support",
];

const statusColor: Record<string, string> = {
  Submitted: "bg-blue-500/10 text-blue-700 border-blue-200",
  "Under Review": "bg-amber-500/10 text-amber-700 border-amber-200",
  "In Progress": "bg-purple-500/10 text-purple-700 border-purple-200",
  Resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-200 font-semibold",
  Closed: "bg-gray-500/10 text-gray-700 border-gray-200",
};

export function StudentGrievancesClient({ grievances }: { grievances: GrievanceRow[] }) {
  const router = useRouter();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<GrievanceRow | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("anonymous", isAnonymous ? "true" : "false");

    const result = await submitGrievance(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Grievance submitted! Ticket: ${result.ticket_number}`);
      setIsSubmitOpen(false);
      setIsAnonymous(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit grievance");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            <span>Grievance Redressal & Help Desk</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Submit confidential concerns or queries directly to the executive committee.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsSubmitOpen(true)} className="h-8 text-xs font-medium">
          <Plus className="mr-1.5 size-3.5" /> Submit Grievance
        </Button>
      </div>

      {/* Ticket Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold py-2.5">Ticket #</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Date</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Subject</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Category</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Status</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grievances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  You haven&apos;t filed any grievances yet. If you face any academic or administrative issues, feel free to submit a ticket.
                </TableCell>
              </TableRow>
            ) : (
              grievances.map((g) => (
                <TableRow key={g.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5 font-mono text-xs font-medium text-foreground whitespace-nowrap">
                    {g.ticket_number}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(g.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2.5 font-medium text-xs max-w-[220px] truncate text-foreground">
                    {g.title}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {g.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 ${statusColor[g.status] ?? ""}`}
                    >
                      {g.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-primary"
                      onClick={() => setViewingTicket(g)}
                    >
                      <Eye className="mr-1 size-3" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Submit Grievance Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <span>Submit Grievance</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-xs font-medium">Subject / Title</label>
              <Input
                name="subject"
                required
                minLength={5}
                maxLength={255}
                placeholder="Brief summary of the issue..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Category</label>
              <select
                name="category"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Detailed Description</label>
              <Textarea
                name="description"
                required
                minLength={10}
                rows={4}
                placeholder="Provide specific details, dates, and relevant facts to help us investigate..."
                className="text-xs"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-2.5 bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="size-3 text-primary" /> Submit Anonymously
                </span>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Your identity will be masked from administrators.
                </p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                aria-label="Toggle anonymous submission"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsSubmitOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Grievance Dialog */}
      <Dialog open={!!viewingTicket} onOpenChange={(open) => !open && setViewingTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                {viewingTicket?.ticket_number}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 ${statusColor[viewingTicket?.status ?? ""] ?? ""}`}
              >
                {viewingTicket?.status}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {viewingTicket?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] pb-1 border-b border-border/70">
              <span>Category: <strong className="text-foreground">{viewingTicket?.category}</strong></span>
              <span>
                {viewingTicket?.created_at && new Date(viewingTicket.created_at).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="font-semibold text-foreground block mb-1">Your Submission:</span>
              <div className="rounded-md bg-muted/30 p-2.5 border border-border leading-relaxed whitespace-pre-wrap">
                {viewingTicket?.description}
              </div>
            </div>

            {/* Admin Response Box */}
            <div className="mt-3">
              <span className="font-semibold text-foreground flex items-center gap-1 mb-1">
                <MessageSquare className="size-3 text-primary" /> Admin Response:
              </span>
              <div className="rounded-md bg-primary/5 p-3 border border-primary/20 text-foreground leading-relaxed">
                {viewingTicket?.admin_response ? (
                  <p className="whitespace-pre-wrap">{viewingTicket.admin_response}</p>
                ) : (
                  <p className="text-muted-foreground italic text-[11px]">
                    Your ticket is currently under review. The executive committee will provide updates here.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setViewingTicket(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
