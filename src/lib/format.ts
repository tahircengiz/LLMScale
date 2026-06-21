// Display formatting helpers.

export function formatGiB(gib: number): string {
  if (gib < 0.01) return "<0.01 GiB";
  if (gib < 1) return `${(gib * 1024).toFixed(0)} MiB`;
  if (gib < 100) return `${gib.toFixed(2)} GiB`;
  return `${gib.toFixed(1)} GiB`;
}

export function formatParams(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
}

export function formatInt(n: number): string {
  return n.toLocaleString();
}
