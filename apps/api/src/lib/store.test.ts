import { describe, expect, it } from "vitest";

import { store } from "./store.js";

describe("room store", () => {
  it("returns the demo room", () => {
    expect(store.getRoom("cyber-city-night")?.title).toBe("Вечер кино с друзьями");
  });
});
