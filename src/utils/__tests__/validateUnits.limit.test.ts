import { describe, it, expect } from "vitest";
import { Document } from "@/interfaces";
import { validateUnits } from "@/utils/validateUnits";
import { makeTable, named, GlucoseCase } from "./fixtures";

interface LimitCase extends GlucoseCase {
  table: Document;
}

const base = (limit?: number): Document => makeTable({ units: 2, list: [80], limit });
const triggers = (limit?: number): Document =>
  makeTable({ units: 3, list: [80, 120, 170, 210], limit });

const cases: LimitCase[] = [
  { id: "L1", desc: "resultado igual ao limite", table: base(4), curr: 241, expected: 4 },
  { id: "L2", desc: "limite menor: aplica o teto", table: base(3), curr: 241, expected: 3 },
  { id: "L3", desc: "limite maior: não interfere", table: base(8), curr: 241, expected: 4 },
  { id: "L4", desc: "lim 0 = sem teto (ver ISSUE-3)", table: base(0), curr: 9999, expected: 125 },
  { id: "L5", desc: "sem lim = sem teto (ver ISSUE-3)", table: base(), curr: 9999, expected: 125 },
  { id: "L6", desc: "teto também vale nos gatilhos", table: triggers(4), curr: 999, expected: 4 },
  { id: "L7", desc: "limite não eleva um resultado 0", table: base(8), curr: 60, expected: 0 },
];

describe("limite", () => {
  it.each(named(cases))("%s", async (_name, { table, curr, expected }) => {
    expect(await validateUnits(curr, table)).toBe(expected);
  });
});
