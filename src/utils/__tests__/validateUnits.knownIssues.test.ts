import { describe, it, expect } from "vitest";
import { validateUnits } from "@/utils/validateUnits";
import { makeTable } from "./fixtures";

// Testes de caracterização: os casos ISSUE-n documentam o comportamento ATUAL
// (indesejado) de validateUnits. Eles passam hoje e serão invertidos na Spec 03.
describe("bordas e problemas conhecidos", () => {
  it("E1 — tabela sem valores não gera erro", async () => {
    const table = makeTable({ units: 2, list: [] });
    expect(await validateUnits(100, table)).toBe(0);
  });

  // ISSUE-1: gatilhos fora de ordem.
  // Atual: o forEach percorre a lista na ordem do array, não na ordem numérica.
  // Com [80,210,120] e gl 150, o último índice atingido é o 2 (valor 120),
  // resultando em 3 + 2 = 5.
  // Esperado: tratar os gatilhos em ordem numérica (ou rejeitar a tabela),
  // o que daria 4 — igual ao caso de referência E4r logo abaixo.
  it("ISSUE-1 — gatilhos fora de ordem produzem dose maior que a lista ordenada", async () => {
    const table = makeTable({ units: 3, list: [80, 210, 120] });
    expect(await validateUnits(150, table)).toBe(5);
  });

  it("E4r — referência do ISSUE-1: gatilhos ordenados [80,120,210]", async () => {
    const table = makeTable({ units: 3, list: [80, 120, 210] });
    expect(await validateUnits(150, table)).toBe(4);
  });

  // ISSUE-2: glicemia negativa é aceita silenciosamente.
  // Atual: gl -5 fica abaixo da base e retorna 0, sem erro nem aviso.
  // Esperado: rejeitar/sinalizar glicemia fora de uma faixa plausível,
  // já que um valor negativo só pode ser erro de digitação ou de leitura.
  it("ISSUE-2 — glicemia negativa é aceita sem erro", async () => {
    const table = makeTable({ units: 2, list: [80] });
    expect(await validateUnits(-5, table)).toBe(0);
  });

  // ISSUE-3: sem teto, dose ilimitada.
  // Atual: limit ausente ou igual a 0 desativa o teto; sem faixa plausível para
  // a glicemia, um erro de digitação (gl 9999) gera uma dose de 125 unidades.
  // Esperado: exigir um teto de segurança e/ou rejeitar glicemias implausíveis
  // (parâmetros a definir com a equipe médica na Spec 03). Ver L4/L5.
  it("ISSUE-3 — lim 0 não aplica teto e gera dose enorme", async () => {
    const table = makeTable({ units: 2, list: [80], limit: 0 });
    expect(await validateUnits(9999, table)).toBe(125);
  });

  it("ISSUE-3 — sem lim não aplica teto e gera dose enorme", async () => {
    const table = makeTable({ units: 2, list: [80] });
    expect(await validateUnits(9999, table)).toBe(125);
  });

  // ISSUE-4: não há como sinalizar "glicemia baixa".
  // Atual: a função devolve apenas um número; gl 79 (abaixo da base) retorna 0,
  // indistinguível de "nenhuma dose necessária". Ver B1, T1, L7.
  // Esperado: o retorno deveria permitir distinguir glicemia abaixo da tabela
  // (hipoglicemia potencial) para que a UI possa alertar o usuário.
  it("ISSUE-4 — glicemia abaixo da base retorna 0 sem sinalizar glicemia baixa", async () => {
    const table = makeTable({ units: 2, list: [80] });
    expect(await validateUnits(79, table)).toBe(0);
  });

  // ISSUE-5: gatilho duplicado pula um nível.
  // Atual: com [80,120,120] e gl 130, o índice da duplicata (2) é o último
  // atingido, resultando em 3 + 2 = 5.
  // Esperado: ignorar/rejeitar gatilhos duplicados, o que daria 4 — igual ao
  // caso de referência E5r logo abaixo.
  it("ISSUE-5 — gatilho duplicado pula um nível", async () => {
    const table = makeTable({ units: 3, list: [80, 120, 120] });
    expect(await validateUnits(130, table)).toBe(5);
  });

  it("E5r — referência do ISSUE-5: gatilhos sem duplicata [80,120]", async () => {
    const table = makeTable({ units: 3, list: [80, 120] });
    expect(await validateUnits(130, table)).toBe(4);
  });
});
