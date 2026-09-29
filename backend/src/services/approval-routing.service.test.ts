import { describe, expect, it } from "vitest";
import {
  autoApprovalEligible,
  manualApprovalLevel,
  roleCanApprove,
} from "./approval-routing.service.js";
describe("approval routing", () => {
  it.each([
    [0, "DEPARTMENT_HEAD"],
    [1_000_000, "DEPARTMENT_HEAD"],
    [1_000_001, "DIRECTOR"],
    [49_999_999, "DIRECTOR"],
    [50_000_000, "DIRECTOR"],
    [50_000_001, "CHAIRMAN"],
  ])("routes %i", (amount, level) =>
    expect(manualApprovalLevel(amount)).toBe(level),
  );
  it("enforces monthly auto limits", () => {
    expect(autoApprovalEligible("DEPARTMENT_HEAD", 1_000_000, 9_000_000)).toBe(
      true,
    );
    expect(autoApprovalEligible("DEPARTMENT_HEAD", 1_000_000, 10_000_000)).toBe(
      false,
    );
    expect(autoApprovalEligible("DIRECTOR", 1_000_000, 49_000_000)).toBe(true);
  });
  it("allows higher authority", () => {
    expect(roleCanApprove("CHAIRMAN", "DIRECTOR")).toBe(true);
    expect(roleCanApprove("DIRECTOR", "CHAIRMAN")).toBe(false);
  });
});
