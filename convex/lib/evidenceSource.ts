"use node";
import { PDFParse } from "pdf-parse";
import { getData } from "pdf-parse/worker";
import { normalizeText, pageText, safeSourceUrl } from "./enrichment";

// Embed the PDF worker so Convex's bundled Node action needs no local files.
PDFParse.setWorker(getData());
const MAX_BYTES = 80 * 1024 * 1024;

export async function readEvidenceSource(source: string): Promise<string> {
  let url = safeSourceUrl(source);
  if (!url) throw new Error("Invalid source URL.");
  let response: Response | undefined;
  for (let hop = 0; hop < 6; hop++) {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(45000) });
    if (![301,302,303,307,308].includes(response.status)) break;
    const location = response.headers.get("location");
    url = location ? safeSourceUrl(new URL(location,url).href) : null;
    if (!url) throw new Error("Invalid source redirect.");
    response = undefined;
  }
  if (!response?.ok || Number(response.headers.get("content-length")) > MAX_BYTES)
    throw new Error("Source unavailable or too large.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty source.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > MAX_BYTES) throw new Error("Source too large.");
      chunks.push(next.value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  const contentType = response.headers.get("content-type") ?? "";
  if (bytes.subarray(0,5).toString() === "%PDF-" || contentType.includes("application/pdf")) {
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText({ pageJoiner: "\n" });
      return normalizeText(result.text);
    } finally { await parser.destroy(); }
  }
  if (!contentType.includes("text/html") && !contentType.includes("text/plain"))
    throw new Error("Unsupported source format.");
  return pageText(bytes.toString("utf8"));
}
