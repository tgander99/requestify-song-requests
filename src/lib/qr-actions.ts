import QRCode from "qrcode";

export const qrOptions = { width: 1024, margin: 4, errorCorrectionLevel: "M" as const };

export async function saveQrPng(url: string, slug: string) {
  const canvas = await QRCode.toCanvas(url, qrOptions);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (value) => value ? resolve(value) : reject(new Error("Couldn't create QR PNG")), "image/png"));
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `requestify-${slug}-qr.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

/** Open synchronously from the click; print only after the QR image is decoded. */
export async function printQr(url: string, name: string) {
  const popup = window.open("", "_blank", "width=700,height=900");
  if (!popup) throw new Error("Allow pop-ups to print your QR code");
  try {
    popup.opener = null;
    const doc = popup.document;
    doc.title = `${name} — Requestify QR`;
    const style = doc.createElement("style");
    style.textContent = `:root{--paper:white;--ink:black} @page{size:A4;margin:20mm}
      body{background:var(--paper);color:var(--ink);font:18px Arial,sans-serif;text-align:center;margin:0;padding:24px}
      h1{font-size:30px} h2{font-size:22px;overflow-wrap:anywhere} img{display:block;width:110mm;max-width:100%;height:auto;margin:24px auto}
      p{overflow-wrap:anywhere} @media print{body{padding:0}}`;
    doc.head.append(style);
    const heading = doc.createElement("h1"); heading.textContent = "Request a song!";
    const event = doc.createElement("h2"); event.textContent = name;
    const img = doc.createElement("img"); img.alt = "Scan to request a song";
    img.src = await QRCode.toDataURL(url, qrOptions);
    const link = doc.createElement("p"); link.textContent = url;
    const footer = doc.createElement("p"); footer.textContent = "NO APP. NO SIGN-UP. JUST SCAN & REQUEST.";
    doc.body.replaceChildren(heading, event, img, link, footer);
    await img.decode();
    popup.focus();
    popup.print();
  } catch (error) {
    popup.close();
    throw error;
  }
}