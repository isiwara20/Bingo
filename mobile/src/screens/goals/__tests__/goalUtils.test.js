import { endForPeriod, validateGoal, percentage } from "../goalUtils";
const values = { title: "Recycle", category: "Recycling", targetAmount: "10", unit: "Items", period: "Monthly", startDate: "2026-10-01", targetDate: "2026-10-31", icon: "recycle" };
test("validates required fields, positive target, real calendar dates and date order", () => {
  expect(validateGoal(values)).toEqual({});
  expect(validateGoal({ ...values, title: " ", targetAmount: "0", targetDate: "2026-09-30" })).toMatchObject({ title: expect.any(String), targetAmount: expect.any(String), targetDate: expect.any(String) });
  expect(validateGoal({ ...values, startDate: "2026-02-30" }).startDate).toBeTruthy();
  expect(validateGoal({ ...values, targetAmount: "0.001" }).targetAmount).toBeTruthy();
});
test("uses inclusive weekly dates and handles month ends and leap years", () => {
  expect(endForPeriod("2026-10-01", "Weekly")).toBe("2026-10-07");
  expect(endForPeriod("2026-10-01", "Monthly")).toBe("2026-10-31");
  expect(endForPeriod("2026-01-31", "Monthly")).toBe("2026-02-28");
  expect(endForPeriod("2028-01-31", "Monthly")).toBe("2028-02-29");
});
test("never displays progress above 100 or marks an unfinished goal 100", () => {
  expect(percentage({ currentProgress: 20, targetAmount: 10 })).toBe(100);
  expect(percentage({ currentProgress: 9.99, targetAmount: 10 })).toBe(99);
  expect(percentage({ currentProgress: 0, targetAmount: 10 })).toBe(0);
});
