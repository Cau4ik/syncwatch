import { describe, expect, it } from "vitest";

import { formatTime } from "./utils";

describe("formatTime", () => {
  it("formats hours when needed", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });
});
