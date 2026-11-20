import { describe, it, expect } from "vitest";
import { fitLines } from "./poster";
const m = (t: string, s: number) => t.length * s * 0.6;
describe("fitLines", () => {
  it("keeps a short name on one line at the start size", () => {
    expect(fitLines(m, "MAKE YOUR REQUEST TO DJ TOM", 2000, 76, 40, 3)).toEqual({ size: 76, lines: ["MAKE YOUR REQUEST TO DJ TOM"] });
  });
  it("never returns a line wider than the box for very long names", () => {
    const r = fitLines(m, "MAKE YOUR REQUEST DIRECTLY TO " + "SUPERCALIFRAGILISTIC ".repeat(8), 2080, 76, 40, 3);
    r.lines.forEach((l) => expect(m(l, r.size)).toBeLessThanOrEqual(2080));
  });
});
