/**
 * lib/site-url.ts
 *
 * Resolves the canonical origin to redirect to.
 *
 * `NEXT_PUBLIC_SITE_URL` is authoritative when set — some deployments sit
 * behind a reverse proxy that does not forward the original public Host
 * header, in which case the raw incoming request's URL/Host resolves to the
 * app's own internal bind address (e.g. "0.0.0.0:3030"), which is not a
 * reachable address for the browser to redirect to. Only when the env var is
 * unset do we fall back to request headers, with the same 0.0.0.0 sanitizing
 * applied either way.
 */

function sanitize(url: string): string {
  return url.includes("0.0.0.0") ? url.replace(/0\.0\.0\.0/g, "localhost") : url;
}

/** For Server Actions / Route Handlers (Node runtime, `next/headers` available). */
export async function resolveSiteUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (envUrl) return sanitize(envUrl);

  const { headers } = await import("next/headers");
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3030";
  const proto = headersList.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  return sanitize(`${proto}://${host}`);
}

/** For Middleware (Edge runtime) — takes the request's headers directly. */
export function resolveSiteUrlFromRequestHeaders(requestHeaders: Headers): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (envUrl) return sanitize(envUrl);

  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3030";
  const proto = requestHeaders.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  return sanitize(`${proto}://${host}`);
}
