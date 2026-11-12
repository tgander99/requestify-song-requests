import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().trim().min(1, "Song title is required").max(120, "Keep the title under 120 characters"),
  artist: z.string().trim().min(1, "Artist is required").max(120, "Keep the artist under 120 characters"),
  guestName: z.string().trim().max(60, "Keep your name under 60 characters").optional().default(""),
  message: z.string().trim().max(280, "Keep the message under 280 characters").optional().default(""),
  // honeypot: real guests never fill this
  website: z.string().optional().default(""),
});
export type RequestInput = z.input<typeof requestSchema>;

/** Same song regardless of case, punctuation or "feat." noise. */
export function normalizeSong(title: string, artist: string) {
  const clean = (s: string) =>
    s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\(.*?\)|\[.*?\]/g, "").replace(/\b(feat|ft)\.?\b.*$/, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  return `${clean(title)}|${clean(artist)}`;
}

export const RATE_LIMIT = { max: 3, windowMinutes: 10 };
export const DUPLICATE_WINDOW_HOURS = 3;
