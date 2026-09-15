"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell,
  FileText,
  BookOpen,
  Search,
  Eye,
  Calendar,
  Pin,
  ExternalLink,
} from "lucide-react";
import type { NoticeDB } from "@/app/dashboard/admin/notices/notices-client";

export function StudentNoticesClient({ notices }: { notices: NoticeDB[] }) {
  const [activeSection, setActiveSection] = useState<string>("General");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<NoticeDB | null>(null);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesSection = n.section === activeSection;
      const matchesQuery =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSection && matchesQuery;
    });
  }, [notices, activeSection, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <span>Notices, Minutes & Documents</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Official announcements, committee meeting minutes, and constitution documents.
          </p>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-auto">
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="General" className="text-xs px-2.5 h-7">
              <Bell className="mr-1.5 size-3" /> General Notices
            </TabsTrigger>
            <TabsTrigger value="Letters & Minutes" className="text-xs px-2.5 h-7">
              <FileText className="mr-1.5 size-3" /> Letters & Minutes
            </TabsTrigger>
            <TabsTrigger value="Documents" className="text-xs px-2.5 h-7">
              <BookOpen className="mr-1.5 size-3" /> Documents
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-2">
        {filteredNotices.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground border-border">
            No notices found under {activeSection}.
          </Card>
        ) : (
          filteredNotices.map((n) => (
            <Card
              key={n.id}
              className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/15 transition-all cursor-pointer"
              onClick={() => setSelectedNotice(n)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {n.is_pinned && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 flex items-center gap-1 font-semibold">
                        <Pin className="size-2.5" /> Pinned
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {n.category}
                    </Badge>
                    {n.document_type && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                        {n.document_type}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Calendar className="size-2.5" />
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{n.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {n.content}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0 h-7 text-xs text-primary">
                  <Eye className="mr-1 size-3" /> View
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Notice Detail Dialog */}
      <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {selectedNotice?.category}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono">
                {selectedNotice?.created_at && new Date(selectedNotice.created_at).toLocaleDateString()}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {selectedNotice?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3 text-xs leading-relaxed max-h-96 overflow-y-auto scrollbar-thin">
            <div className="whitespace-pre-wrap text-foreground">
              {selectedNotice?.content}
            </div>

            {/* If there's an attached image (Letters & Minutes) */}
            {selectedNotice?.image_url && (
              <div className="mt-3 rounded-lg border border-border p-2 bg-muted/20">
                <p className="font-semibold text-foreground mb-1.5">Attached Document Image:</p>
                <div className="overflow-hidden rounded border border-border max-h-72 flex items-center justify-center bg-black/5">
                  <img
                    src={selectedNotice.image_url}
                    alt={selectedNotice.title}
                    className="object-contain max-h-72 w-full"
                  />
                </div>
                <div className="mt-2 text-right">
                  <a
                    href={selectedNotice.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-primary font-medium hover:underline"
                  >
                    Open full image <ExternalLink className="ml-1 size-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setSelectedNotice(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
