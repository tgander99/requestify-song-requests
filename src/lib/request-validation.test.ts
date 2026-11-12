import { describe, it, expect } from "vitest";
import { normalizeSong, requestSchema, RATE_LIMIT } from "./request-validation";

describe("song request rules", () => {
  it("requires title and artist", () => {
    expect(requestSchema.safeParse({ title: " ", artist: "x" }).success).toBe(false);
    expect(requestSchema.safeParse({ title: "x", artist: "" }).success).toBe(false);
    expect(requestSchema.safeParse({ title: "One More Time", artist: "Daft Punk" }).success).toBe(true);
  });
  it("treats case/punctuation/feat variants as duplicates", () => {
    expect(normalizeSong("Levels (Radio Edit)", "AVICII")).toBe(normalizeSong("levels", "Avicii"));
    expect(normalizeSong("Titanium", "David Guetta feat. Sia")).toBe(normalizeSong("Titanium!", "David Guetta"));
  });
  it("limits guests to 3 requests per 10 minutes", () => {
    expect(RATE_LIMIT).toEqual({ max: 3, windowMinutes: 10 });
  });
});
