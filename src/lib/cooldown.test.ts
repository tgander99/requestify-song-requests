import { describe, expect, it } from "vitest";
import { cooldownMinutesSchema, DEFAULT_COOLDOWN_MINUTES, formatCooldown } from "./cooldown";

describe("guest cooldown rules", () => {
  it("defaults to 5 minutes", () => {
    expect(DEFAULT_COOLDOWN_MINUTES).toBe(5);
  });
  it("allows Off (0 minutes)", () => {
    expect(cooldownMinutesSchema.parse(0)).toBe(0);
  });
  it("allows every whole minute through 60 and rejects values outside the range", () => {
    for (let minute = 1; minute <= 60; minute++) expect(cooldownMinutesSchema.parse(minute)).toBe(minute);
    for (const minute of [-1, 61, 1.5]) expect(cooldownMinutesSchema.safeParse(minute).success).toBe(false);
  });
  it("counts down the remaining time without becoming negative", () => {
    expect(formatCooldown(300)).toBe("5:00");
    expect(formatCooldown(59.1)).toBe("1:00");
    expect(formatCooldown(0)).toBe("0:00");
    expect(formatCooldown(-1)).toBe("0:00");
  });
});