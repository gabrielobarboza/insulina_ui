import { describe, it, expect } from "vitest";
import { validateUnits } from "@/utils/validateUnits";
import { makeTable, named, GlucoseCase } from "./fixtures";

// Modo gatilhos — list: [80,120,170,210], ui: 3
const list = [80, 120, 170, 210];
const table = makeTable({ units: 3, list });
// T10: mesma tabela com custom: 60, para provar que custom é ignorado
const tableWithCustom = makeTable({ units: 3, list, custom: 60 });

const cases: GlucoseCase[] = [
  { id: "T1", desc: "abaixo do primeiro gatilho", curr: 79, expected: 0 },
  { id: "T2", desc: "igual ao primeiro gatilho", curr: 80, expected: 3 },
  { id: "T3", desc: "um pouco antes do segundo gatilho", curr: 119, expected: 3 },
  { id: "T4", desc: "valor igual ao gatilho conta como atingido", curr: 120, expected: 4 },
  { id: "T5", desc: "um pouco antes do terceiro gatilho", curr: 169, expected: 4 },
  { id: "T6", desc: "igual ao terceiro gatilho", curr: 170, expected: 5 },
  // Exemplo 3 da tela de ajuda do CalcTableForm (FR-004)
  { id: "T7", desc: "exemplo 3 da tela de ajuda", curr: 198, expected: 5 },
  { id: "T8", desc: "igual ao último gatilho", curr: 210, expected: 6 },
  { id: "T9", desc: "sem teto, satura no último gatilho", curr: 999, expected: 6 },
];

describe("modo gatilhos", () => {
  it.each(named(cases))("%s", async (_name, { curr, expected }) => {
    expect(await validateUnits(curr, table)).toBe(expected);
  });

  it("T10 — com custom: 60 junto, custom é ignorado", async () => {
    expect(await validateUnits(150, tableWithCustom)).toBe(4);
  });
});
