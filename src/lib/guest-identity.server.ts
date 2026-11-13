import { getCookie, getRequestUrl, setCookie } from "@tanstack/react-start/server";

/** Server-issued browser identity, independent of shared Wi-Fi or device model. */
export async function guestHash() {
  let identity = getCookie("requestify_guest");
  if (!identity || !/^[0-9a-f-]{36}$/.test(identity)) {
    identity = crypto.randomUUID();
    setCookie("requestify_guest", identity, {
      httpOnly: true, sameSite: "lax", secure: getRequestUrl().protocol === "https:",
      path: "/", maxAge: 60 * 60 * 24 * 365,
    });
  }
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}