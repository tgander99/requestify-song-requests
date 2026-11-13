import { z } from "zod";

export const DEFAULT_COOLDOWN_MINUTES = 5;
export const cooldownMinutesSchema = z.number().int().min(0).max(60);

export function formatCooldown(seconds: number) {
  const remaining = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
}

export type CooldownState = { remainingSeconds: number; cooldownMinutes: number };