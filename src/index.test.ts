import { expect, test } from "vitest";
import { foo } from ".";

test("simple", () => {
  expect(foo).toEqual("foo");
});
