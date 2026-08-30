/** Which multi-page entry is being rendered, derived from the pathname. */
export type PageId = "sizing" | "fit" | "vllm" | "decode" | "anatomy" | "compare" | "learn";

export function currentPage(): PageId {
  const p = window.location.pathname;
  if (p.endsWith("fit.html")) return "fit";
  if (p.endsWith("vllm.html")) return "vllm";
  if (p.endsWith("decode.html")) return "decode";
  if (p.endsWith("anatomy.html")) return "anatomy";
  if (p.endsWith("compare.html")) return "compare";
  return "sizing";
}
