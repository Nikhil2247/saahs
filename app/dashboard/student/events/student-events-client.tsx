"use client";

import { useState, useTransition, useMemo } from "react";
import { toggleEventRegistration } from "@/app/actions/events";
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
  Calendar,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { EventRow } from "@/types/database";

export function StudentEventsClient({
  events,
  registeredEventIds,
}: {
  events: EventRow[];
  registeredEventIds: number[];
}) {
  const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set(registeredEventIds));
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date().toISOString();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isPast = e.past_archive || e.schedule < now;
      const matchesTab = activeTab === "upcoming" ? !isPast : isPast;

      const matchesCategory =
        categoryFilter === "all" || e.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [events, activeTab, categoryFilter, searchQuery, now]);

  const handleToggleRegister = (eventId: number) => {
    startTransition(async () => {
      const result = await toggleEventRegistration(eventId);
      if (result.success) {
        setRegisteredIds((prev) => {
          const next = new Set(prev);
          if (result.registered) {
            next.add(eventId);
            toast.success("Successfully registered for event!");
          } else {
            next.delete(eventId);
            toast.info("Registration cancelled.");
          }
          return next;
        });
      } else {
        toast.error(result.error || "Failed to update registration");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <span>Events & Academic Workshops</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Conferences, symposia, sports meets, and cultural festivals hosted by SAAHS.
          </p>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="upcoming" className="text-xs px-3 h-7">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past" className="text-xs px-3 h-7">Past Archives</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search events or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground border rounded-lg border-border bg-card">
            No events found in this category.
          </div>
        ) : (
          filteredEvents.map((e) => {
            const isRegistered = registeredIds.has(e.id);
            return (
              <Card
                key={e.id}
                className="overflow-hidden border-border shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {e.banner_url && (
                    <div className="h-32 w-full overflow-hidden bg-muted/40 relative">
                      <img
                        src={e.banner_url}
                        alt={e.title}
                        className="h-full w-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-background/90 text-foreground backdrop-blur-xs border border-border">
                        {e.category}
                      </Badge>
                    </div>
                  )}

                  <div className="p-3.5 space-y-2">
                    {!e.banner_url && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mb-1">
                        {e.category}
                      </Badge>
                    )}
                    <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
                      {e.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {e.description}
                    </p>

                    <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-primary shrink-0" />
                        <span>
                          {new Date(e.schedule).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-primary shrink-0" />
                        <span className="truncate">{e.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 pt-0 border-t border-border/50 mt-2 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedEvent(e)}
                  >
                    <Info className="mr-1 size-3" /> Details
                  </Button>

                  {activeTab === "upcoming" && (
                    <Button
                      size="sm"
                      variant={isRegistered ? "outline" : "default"}
                      disabled={isPending}
                      className={`h-7 text-xs px-2.5 font-medium ${
                        isRegistered ? "border-emerald-300 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10" : ""
                      }`}
                      onClick={() => handleToggleRegister(e.id)}
                    >
                      {isRegistered ? (
                        <>
                          <CheckCircle2 className="mr-1 size-3 text-emerald-600" /> Registered
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 mb-1">
              {selectedEvent?.category}
            </Badge>
            <DialogTitle className="text-base font-bold text-foreground">
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent?.banner_url && (
            <div className="overflow-hidden rounded-md border border-border max-h-48">
              <img
                src={selectedEvent.banner_url}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/30 p-2.5 border border-border">
              <div>
                <span className="text-muted-foreground block text-[10px]">Date & Time</span>
                <span className="font-semibold text-foreground">
                  {selectedEvent?.schedule &&
                    new Date(selectedEvent.schedule).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Venue</span>
                <span className="font-semibold text-foreground truncate block">
                  {selectedEvent?.venue}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Description
              </span>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedEvent?.description}
              </p>
            </div>

            {selectedEvent?.organizer_info && (
              <div className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Organizer: </span>
                {selectedEvent.organizer_info}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
            {selectedEvent && (
              <Button
                size="sm"
                variant={registeredIds.has(selectedEvent.id) ? "outline" : "default"}
                onClick={() => {
                  handleToggleRegister(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                {registeredIds.has(selectedEvent.id) ? "Cancel Registration" : "Register Now"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
