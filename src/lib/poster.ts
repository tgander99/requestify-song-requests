import QRCode from "qrcode";

// A4 at 300 dpi
export const POSTER_W = 2480;
export const POSTER_H = 3508;
const NAVY = "#0b1f4d";
const CYAN = "#00b8e6";
const PURPLE = "#8b3dff";
const MUTED = "#6b7280";
const DISPLAY = "Unbounded, 'Arial Black', sans-serif";
const SANS = "'Space Grotesk', Arial, sans-serif";

/** Split text into at most `maxLines` lines fitting `maxW`, shrinking the font until it fits. */
export function fitLines(measure: (t: string, size: number) => number, text: string, maxW: number, start: number, min: number, maxLines = 2) {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = start; size >= min; size -= 2) {
    const lines: string[] = [];
    let cur = "";
    let ok = true;
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (measure(next, size) <= maxW) { cur = next; continue; }
      if (cur) lines.push(cur);
      cur = w;
      if (measure(w, size) > maxW) { ok = false; break; }
    }
    if (cur) lines.push(cur);
    if (ok && lines.length <= maxLines) return { size, lines };
  }
  // Last resort: hard-break characters at min size
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (measure(cur + ch, min) > maxW) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return { size: min, lines: lines.slice(0, maxLines) };
}

export async function renderPoster(djName: string, url: string): Promise<HTMLCanvasElement> {
  await Promise.all([`900 120px Unbounded`, `700 60px "Space Grotesk"`].map((f) => document.fonts?.load(f).catch(() => null)));
  const c = document.createElement("canvas");
  c.width = POSTER_W; c.height = POSTER_H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const cx = POSTER_W / 2;

  // Logo: equalizer + wordmark
  ctx.font = `700 150px ${DISPLAY}`;
  const wA = ctx.measureText("Request").width, wB = ctx.measureText("ify").width;
  const barsW = 4 * 34 + 3 * 22, gap = 50;
  const total = barsW + gap + wA + wB;
  let x = cx - total / 2;
  const baseY = 520;
  [0.6, 1, 0.75, 0.45].forEach((h, i) => {
    const bh = 170 * h;
    const g = ctx.createLinearGradient(0, baseY - 170, 0, baseY);
    g.addColorStop(0, CYAN); g.addColorStop(1, PURPLE);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x + i * 56, baseY - bh, 34, bh, 17); ctx.fill();
  });
  x += barsW + gap;
  ctx.textAlign = "left";
  ctx.fillStyle = NAVY; ctx.fillText("Request", x, baseY);
  ctx.fillStyle = CYAN; ctx.fillText("ify", x + wA, baseY);
  ctx.textAlign = "center";

  // Headline
  ctx.fillStyle = NAVY; ctx.font = `900 230px ${DISPLAY}`; ctx.fillText("GOT A SONG", cx, 1000);
  ctx.fillStyle = CYAN; ctx.fillText("IN MIND?", cx, 1250);

  // Subtitle with DJ name (wraps / shrinks, never clipped)
  const sub = `MAKE YOUR REQUEST DIRECTLY TO ${djName.trim().toUpperCase() || "THE DJ"}`;
  ctx.fillStyle = MUTED;
  const fit = fitLines((t, s) => { ctx.font = `600 ${s}px ${SANS}`; return ctx.measureText(t).width; }, sub, POSTER_W - 400, 76, 40, 3);
  ctx.font = `600 ${fit.size}px ${SANS}`;
  let y = 1440;
  fit.lines.forEach((l) => { ctx.fillText(l, cx, y); y += fit.size * 1.3; });

  ctx.fillStyle = NAVY; ctx.font = `700 84px ${SANS}`;
  ctx.fillText("SCAN TO REQUEST A SONG", cx, y + 110);

  // QR: black on white, 4-module quiet zone, integer module size
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size, quiet = 4;
  const mod = Math.floor(1350 / (n + quiet * 2));
  const qs = mod * (n + quiet * 2);
  const qx = Math.round(cx - qs / 2), qy = Math.round(y + 200);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(qx, qy, qs, qs);
  ctx.fillStyle = "#000000";
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++)
    if (qr.modules.get(r, col)) ctx.fillRect(qx + (col + quiet) * mod, qy + (r + quiet) * mod, mod, mod);

  // Footer
  const fy = POSTER_H - 260;
  const lg = ctx.createLinearGradient(cx - 600, 0, cx + 600, 0);
  lg.addColorStop(0, CYAN); lg.addColorStop(1, PURPLE);
  ctx.fillStyle = lg; ctx.fillRect(cx - 600, fy - 130, 1200, 8);
  ctx.fillStyle = NAVY; ctx.font = `700 64px ${SANS}`;
  ctx.fillText("NO APP. NO SIGN-UP. JUST SCAN & REQUEST.", cx, fy);
  return c;
}

export async function posterPng(c: HTMLCanvasElement) {
  return new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
}

export async function posterPdf(png: Blob) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle("Requestify poster");
  const page = doc.addPage([595.28, 841.89]);
  const img = await doc.embedPng(new Uint8Array(await png.arrayBuffer()));
  page.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
  return new Blob([(await doc.save()).slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
