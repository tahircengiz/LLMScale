// Thin wrapper around the self-hosted Umami tracker (loaded via the <script>
// in each page's <head>). No-op when the tracker isn't present (blocked,
// offline, or local dev) — analytics must never break or slow the app.

type UmamiFn = (event: string, data?: Record<string, unknown>) => void;

export function track(event: string, data?: Record<string, unknown>): void {
  try {
    const u = (window as unknown as { umami?: { track?: UmamiFn } }).umami;
    u?.track?.(event, data);
  } catch {
    /* swallow — never let analytics throw into the app */
  }
}
