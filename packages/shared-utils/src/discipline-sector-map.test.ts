import { describe, expect, it } from "vitest";
import { Discipline, Sector } from "@scholva/shared-types";
import { getDisciplinesForSector, getSectorsForDiscipline } from "./discipline-sector-map.js";

describe("discipline-sector mapping", () => {
  it("maps agriculture to industry sectors", () => {
    expect(getSectorsForDiscipline(Discipline.Agriculture)).toContain(Sector.Agriculture);
  });

  it("maps a sector back to related disciplines", () => {
    expect(getDisciplinesForSector(Sector.Healthcare)).toContain(Discipline.Medicine);
  });
});
