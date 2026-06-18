import { Discipline, Sector } from "@scholva/shared-types";

export const DISCIPLINE_TO_SECTORS: Readonly<Record<Discipline, readonly Sector[]>> = {
  [Discipline.Engineering]: [
    Sector.Engineering,
    Sector.Manufacturing,
    Sector.Construction,
    Sector.Energy,
    Sector.Logistics
  ],
  [Discipline.ComputerScience]: [
    Sector.Fintech,
    Sector.Technology,
    Sector.Logistics,
    Sector.Healthcare,
    Sector.Education
  ],
  [Discipline.Agriculture]: [
    Sector.Agriculture,
    Sector.FoodAndBeverage,
    Sector.Environmental
  ],
  [Discipline.Medicine]: [Sector.Healthcare, Sector.Pharma],
  [Discipline.Pharmacy]: [Sector.Pharma, Sector.Healthcare],
  [Discipline.Economics]: [
    Sector.Fintech,
    Sector.Agriculture,
    Sector.Manufacturing,
    Sector.Education
  ],
  [Discipline.Law]: [Sector.Legal, Sector.Finance, Sector.Government],
  [Discipline.Education]: [Sector.Education, Sector.Technology],
  [Discipline.Architecture]: [
    Sector.Construction,
    Sector.UrbanDevelopment,
    Sector.Government
  ],
  [Discipline.SocialSciences]: [
    Sector.Healthcare,
    Sector.Education,
    Sector.Government,
    Sector.NGO
  ],
  [Discipline.EnvironmentalSciences]: [
    Sector.Environmental,
    Sector.Agriculture,
    Sector.Energy
  ],
  [Discipline.Other]: []
};

export function getSectorsForDiscipline(discipline: string): readonly Sector[] {
  return isDiscipline(discipline) ? DISCIPLINE_TO_SECTORS[discipline] : [];
}

export function getDisciplinesForSector(sector: string): readonly Discipline[] {
  if (!isSector(sector)) {
    return [];
  }

  return Object.entries(DISCIPLINE_TO_SECTORS)
    .filter(([, sectors]) => sectors.includes(sector))
    .map(([discipline]) => discipline as Discipline);
}

export function isDiscipline(value: string): value is Discipline {
  return Object.values(Discipline).includes(value as Discipline);
}

export function isSector(value: string): value is Sector {
  return Object.values(Sector).includes(value as Sector);
}
