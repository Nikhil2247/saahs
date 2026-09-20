/**
 * lib/roles.ts
 *
 * Centralised role constants and permission helpers for SAAHS.
 * Used by server components, server actions, and client components alike.
 */

// ── Role tier sets ─────────────────────────────────────────────────────────

/** Only these two roles may approve / reject / remove members. */
export const MEMBER_MANAGEMENT_ROLES = new Set(["President", "Vice President"]);

/**
 * Governing-body tier — can post notices & documents, resolve grievances,
 * and access E-Library upload. Includes Secretariat roles.
 */
export const GOVERNING_BODY_ROLES = new Set([
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Literary Secretary",
  "Governing Body Member",
]);

/** Executive-body tier — view-only student details + E-Library access (no upload). */
export const EXECUTIVE_BODY_ROLES = new Set(["Executive Body Member"]);

/** Faculty role — can view students from their own department + upload to E-Library. */
export const FACULTY_ROLES = new Set(["Faculty"]);

/**
 * All roles that are allowed to access /dashboard/admin/*.
 * Faculty is intentionally included here so they land on the admin layout
 * (which gives them a restricted sidebar).
 */
export const ADMIN_ROLES = new Set([
  "Executive Body Member",
  "Governing Body Member",
  "Literary Secretary",
  "Treasurer",
  "General Secretary",
  "Vice President",
  "President",
  "Faculty",
]);

// ── Permission helpers ──────────────────────────────────────────────────────

/** President and VP can approve, reject or remove members. */
export function canManageMembers(role: string | null | undefined): boolean {
  return MEMBER_MANAGEMENT_ROLES.has(role ?? "");
}

/** Governing-body tier and above can post notices / documents. */
export function canPostNotices(role: string | null | undefined): boolean {
  return GOVERNING_BODY_ROLES.has(role ?? "");
}

/** Governing-body tier and above can resolve / manage grievances. */
export function canResolveGrievances(role: string | null | undefined): boolean {
  return GOVERNING_BODY_ROLES.has(role ?? "");
}

/** Everyone except pure public users can access E-Library. */
export function canAccessLibrary(role: string | null | undefined): boolean {
  return ADMIN_ROLES.has(role ?? "");
}

/**
 * Faculty and Governing-body members can upload to E-Library.
 * Executive Body Members can only READ.
 */
export function canUploadToLibrary(role: string | null | undefined): boolean {
  return GOVERNING_BODY_ROLES.has(role ?? "") || FACULTY_ROLES.has(role ?? "");
}

/** Returns true if the role is faculty. */
export function isFaculty(role: string | null | undefined): boolean {
  return role === "Faculty";
}

/** Returns true if the role is President or VP. */
export function isLeadership(role: string | null | undefined): boolean {
  return MEMBER_MANAGEMENT_ROLES.has(role ?? "");
}

/** Returns true if the role is in the governing body (includes leadership). */
export function isGoverningBody(role: string | null | undefined): boolean {
  return GOVERNING_BODY_ROLES.has(role ?? "");
}

/** Returns a human-readable tier label for a given role. */
export function getRoleTier(role: string | null | undefined): string {
  const r = role ?? "";
  if (MEMBER_MANAGEMENT_ROLES.has(r)) return "Leadership";
  if (GOVERNING_BODY_ROLES.has(r)) return "Governing Body";
  if (EXECUTIVE_BODY_ROLES.has(r)) return "Executive Body";
  if (FACULTY_ROLES.has(r)) return "Faculty";
  return "Member";
}

/**
 * Sidebar nav items available to each role tier.
 * Returns a set of allowed route prefixes.
 */
export function getAllowedAdminRoutes(role: string | null | undefined): string[] {
  const r = role ?? "";

  if (MEMBER_MANAGEMENT_ROLES.has(r)) {
    // VP and President — everything
    return [
      "/dashboard/admin",
      "/dashboard/admin/users",
      "/dashboard/admin/memberships",
      "/dashboard/admin/notices",
      "/dashboard/admin/events",
      "/dashboard/admin/grievances",
      "/dashboard/admin/library",
      "/dashboard/admin/meetings",
      "/dashboard/admin/institutions",
    ];
  }

  if (GOVERNING_BODY_ROLES.has(r)) {
    // Governing body — no Users page, but everything else
    return [
      "/dashboard/admin",
      "/dashboard/admin/memberships",
      "/dashboard/admin/notices",
      "/dashboard/admin/events",
      "/dashboard/admin/grievances",
      "/dashboard/admin/library",
      "/dashboard/admin/meetings",
      "/dashboard/admin/institutions",
    ];
  }

  if (EXECUTIVE_BODY_ROLES.has(r)) {
    // Executive body — overview + E-Library only
    return ["/dashboard/admin", "/dashboard/admin/library"];
  }

  if (FACULTY_ROLES.has(r)) {
    // Faculty — overview + E-Library only
    return ["/dashboard/admin", "/dashboard/admin/library"];
  }

  return ["/dashboard/admin"];
}
