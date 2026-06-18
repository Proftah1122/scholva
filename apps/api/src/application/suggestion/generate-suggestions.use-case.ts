import type { UUID } from "@scholva/shared-types";
import { getSectorsForDiscipline } from "@scholva/shared-utils";
import type { IProblemRepository } from "../../domain/industry/repositories.js";
import type { IScholarRepository } from "../../domain/scholar/repositories.js";
import type { IEmbedderPort } from "../ports/embedder.port.js";
import type { IEmailPort } from "../ports/email.port.js";
import type { ISuggestionPort } from "../ports/suggestion.port.js";

export interface GenerateSuggestionsInput {
  readonly scholarId: UUID;
}

export interface GenerateSuggestionsOutput {
  readonly batchId: UUID;
  readonly suggestionsCount: number;
}

export class GenerateSuggestionsUseCase {
  constructor(
    private readonly scholars: IScholarRepository,
    private readonly problems: IProblemRepository,
    private readonly suggestions: ISuggestionPort,
    private readonly embedder: IEmbedderPort,
    private readonly email: IEmailPort
  ) {}

  async execute(input: GenerateSuggestionsInput): Promise<GenerateSuggestionsOutput> {
    const scholar = await this.scholars.findById(input.scholarId);
    if (scholar === null) {
      throw new Error("Scholar not found");
    }

    const sectors = getSectorsForDiscipline(scholar.disciplineFocus);
    const openProblems = await this.problems.findRecentOpenToStudentsBySectors(sectors, 10);
    const drafts = await this.suggestions.generateTopicSuggestions({
      scholarDiscipline: scholar.disciplineFocus,
      graduationYear: scholar.graduationYear,
      openProblems,
      count: 5
    });

    await Promise.all(drafts.map((draft) => this.embedder.embedDocument(`${draft.title}. ${draft.rationale}`)));
    await this.email.sendTopicSuggestions("pending-email-binding@scholva.local", scholar.fullName, drafts);

    return {
      batchId: "00000000-0000-0000-0000-000000000000",
      suggestionsCount: drafts.length
    };
  }
}
