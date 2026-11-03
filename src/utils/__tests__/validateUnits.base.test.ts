import { describe, it, expect } from "vitest";
import { validateUnits } from "@/utils/validateUnits";
import { makeTable, named, GlucoseCase } from "./fixtures";

// Modo base — list: [80], ui: 2
const table = makeTable({ units: 2, list: [80] });

const cases: GlucoseCase[] = [
  { id: "B1", desc: "abaixo da base", curr: 79, expected: 0 },
  { id: "B2", desc: "igual à base conta como atingido", curr: 80, expected: 2 },
  { id: "B3", desc: "um pouco antes do próximo degrau", curr: 159, expected: 2 },
  { id: "B4", desc: "primeiro degrau", curr: 160, expected: 3 },
  // Exemplo 1 da tela de ajuda do CalcTableForm (FR-004)
  { id: "B5", desc: "exemplo 1 da tela de ajuda", curr: 241, expected: 4 },
  { id: "B6", desc: "glicemia decimal; floor", curr: 160.5, expected: 3 },
];

describe("modo base", () => {
  it.each(named(cases))("%s", async (_name, { curr, expected }) => {
    expect(await validateUnits(curr, table)).toBe(expected);
  });
});
