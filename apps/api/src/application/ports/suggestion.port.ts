export interface SuggestedTopicDraft {
  readonly title: string;
  readonly rationale: string;
  readonly relatedProblemId: string | null;
  readonly discipline: string;
}

export interface ISuggestionPort {
  generateTopicSuggestions(params: {
    readonly scholarDiscipline: string;
    readonly graduationYear: number;
    readonly openProblems: readonly {
      readonly id: string;
      readonly title: string;
      readonly description: string;
      readonly sector: string;
    }[];
    readonly count: number;
  }): Promise<readonly SuggestedTopicDraft[]>;
}
