import { describe, it, expect } from "vitest";
import { dedupeSuggestions } from "./song-search";
describe("dedupeSuggestions", () => {
  it("drops case-insensitive duplicates and blanks", () => {
    expect(dedupeSuggestions([{ title: "Mr. Brightside", artist: "The Killers" }, { title: "mr. brightside", artist: "the killers" }, { title: "", artist: "X" }]))
      .toEqual([{ title: "Mr. Brightside", artist: "The Killers" }]);
  });
  it("caps at 6 results", () => {
    expect(dedupeSuggestions(Array.from({ length: 10 }, (_, i) => ({ title: `S${i}`, artist: "A" })))).toHaveLength(6);
  });
});
