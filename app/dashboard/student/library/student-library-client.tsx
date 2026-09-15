"use client";

import { useState, useCallback } from "react";
import { getFolders, getResourcesByFolder } from "@/app/actions/admin/library";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  FolderOpen,
  Layers,
  GraduationCap,
  Eye,
  Search,
  ChevronRight,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

type Folder = {
  id: number;
  name: string;
  course: string;
  semester: string;
  created_at: string;
};

type Resource = {
  id: number;
  title: string;
  category: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  folder_id: number | null;
  created_at: string;
};

export function StudentLibraryClient({ initialFolders }: { initialFolders: Folder[] }) {
  const [folders] = useState<Folder[]>(initialFolders);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [folderResources, setFolderResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const openFolderView = async (folder: Folder) => {
    setOpenFolder(folder);
    setLoadingResources(true);
    const { data } = await getResourcesByFolder(folder.id);
    setFolderResources((data as Resource[]) || []);
    setLoadingResources(false);
  };

  const uniqueCourses = Array.from(new Set(folders.map((f) => f.course)));
  const semestersForCourse = selectedCourse
    ? Array.from(
        new Set(
          folders
            .filter((f) => f.course === selectedCourse)
            .map((f) => f.semester)
        )
      )
    : [];
  const foldersForSelection = folders.filter(
    (f) => f.course === selectedCourse && f.semester === selectedSemester
  );

  const filteredResources = folderResources.filter(
    (r) =>
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <span>E-Library & Study Material</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Academic notes, previous year exam papers, presentations, and verified clinical references.
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {(selectedCourse || openFolder) && (
        <div className="flex items-center gap-1.5 text-xs flex-wrap bg-muted/30 px-3 py-2 rounded-lg border border-border">
          <button
            onClick={() => {
              setSelectedCourse(null);
              setSelectedSemester(null);
              setOpenFolder(null);
            }}
            className="text-primary hover:underline font-semibold"
          >
            All Disciplines
          </button>
          {selectedCourse && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" />
              <button
                onClick={() => {
                  setSelectedSemester(null);
                  setOpenFolder(null);
                }}
                className="text-primary hover:underline font-medium truncate max-w-[200px]"
              >
                {selectedCourse}
              </button>
            </>
          )}
          {selectedSemester && !openFolder && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground">{selectedSemester}</span>
            </>
          )}
          {openFolder && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" />
              <button
                onClick={() => {
                  setOpenFolder(null);
                  setFolderResources([]);
                }}
                className="text-primary hover:underline font-medium"
              >
                {selectedSemester}
              </button>
              <ChevronRight className="size-3 text-muted-foreground" />
              <span className="font-semibold text-foreground">{openFolder.name}</span>
            </>
          )}
        </div>
      )}

      {/* LEVEL 0: Courses Grid */}
      {!selectedCourse && !openFolder && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Select your discipline to access syllabus-specific resource folders:
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueCourses.length === 0 ? (
              <Card className="col-span-full p-8 text-center text-xs text-muted-foreground border-border">
                No study resources published yet.
              </Card>
            ) : (
              uniqueCourses.map((course) => {
                const count = folders.filter((f) => f.course === course).length;
                return (
                  <Card
                    key={course}
                    onClick={() => setSelectedCourse(course)}
                    className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/20 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <GraduationCap className="size-4" />
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {count} {count === 1 ? "folder" : "folders"}
                        </Badge>
                      </div>
                      <h3 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                        {course}
                      </h3>
                    </div>
                    <div className="mt-2.5 flex items-center text-[11px] text-primary font-medium">
                      <span>Browse Semesters</span>
                      <ChevronRight className="ml-1 size-3" />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* LEVEL 1: Semesters Grid */}
      {selectedCourse && !selectedSemester && !openFolder && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Showing available semesters for <strong className="text-foreground">{selectedCourse}</strong>:
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {semestersForCourse.map((sem) => {
              const folderCount = folders.filter(
                (f) => f.course === selectedCourse && f.semester === sem
              ).length;
              return (
                <Card
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/20 transition-all cursor-pointer"
                >
                  <Layers className="size-6 text-primary mb-2" />
                  <p className="text-xs font-semibold text-foreground">{sem}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {folderCount} {folderCount === 1 ? "folder" : "folders"}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 2: Folders */}
      {selectedCourse && selectedSemester && !openFolder && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Subject Folders in <strong className="text-foreground">{selectedSemester}</strong>:
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {foldersForSelection.map((f) => (
              <Card
                key={f.id}
                onClick={() => openFolderView(f)}
                className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/20 transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <FolderOpen className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Created {new Date(f.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 3: Inside Folder Resource List */}
      {openFolder && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="size-4 text-amber-600" />
                <span>{openFolder.name}</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {openFolder.course} · {openFolder.semester}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search files in folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-7 text-xs bg-background"
              />
            </div>
          </div>

          {loadingResources ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading resources...
            </div>
          ) : filteredResources.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground border-border">
              No files uploaded to this folder yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredResources.map((res) => (
                <Card
                  key={res.id}
                  className="p-3 border-border shadow-2xs hover:border-primary/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{res.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                          {res.category}
                        </Badge>
                        <span>{new Date(res.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* View-only: no download attribute */}
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Eye className="size-3" />
                    <span>View</span>
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
