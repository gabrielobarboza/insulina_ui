import { Document } from "@/interfaces";

/** One row of a table-driven (it.each) test case. */
export interface GlucoseCase {
  id: string; // e.g. "B1", "T7", "L2" — matches spec.md Test Cases table
  desc: string; // descrição usada no nome do teste: "<id> — <desc>"
  curr: number; // glicemia informada (gl)
  expected: number; // resultado esperado
}

export interface TableParams {
  units: number;
  list: number[];
  custom?: number;
  limit?: number;
}

/**
 * Pairs each case with its test name "<id> — <desc>", for use with
 * it.each(...)("%s", ...) — `$id` interpolation would quote and truncate strings.
 */
export function named<T extends GlucoseCase>(cases: T[]): [string, T][] {
  return cases.map((c): [string, T] => [`${c.id} — ${c.desc}`, c]);
}

/** Minimal factory to build a Document fixture without `any`. */
export function makeTable(params: TableParams): Document {
  return {
    name: "test-table", // Document.name is required but not under test
    units: params.units,
    values: { list: params.list, custom: params.custom },
    limit: params.limit,
  };
}
