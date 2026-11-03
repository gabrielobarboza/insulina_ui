import { describe, it, expect } from "vitest";
import { validateUnits } from "@/utils/validateUnits";
import { makeTable, named, GlucoseCase } from "./fixtures";

// Modo incremental — list: [80], custom: 60, ui: 2
const table = makeTable({ units: 2, list: [80], custom: 60 });

const cases: GlucoseCase[] = [
  { id: "I1", desc: "igual à base", curr: 80, expected: 2 },
  { id: "I2", desc: "um pouco antes do primeiro incremento", curr: 139, expected: 2 },
  { id: "I3", desc: "primeiro incremento", curr: 140, expected: 3 },
  // Exemplo 2 da tela de ajuda do CalcTableForm (FR-004)
  { id: "I4", desc: "exemplo 2 da tela de ajuda", curr: 268, expected: 5 },
];

describe("modo incremental", () => {
  it.each(named(cases))("%s", async (_name, { curr, expected }) => {
    expect(await validateUnits(curr, table)).toBe(expected);
  });
});
