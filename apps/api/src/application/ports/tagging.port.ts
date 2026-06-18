export interface ProjectTags {
  readonly discipline: string;
  readonly problemDomain: string;
  readonly methodology: string;
  readonly keywords: readonly string[];
}

export interface ITaggingPort {
  extractTags(title: string, abstract: string): Promise<ProjectTags>;
  generateMatchExplanation(problemDescription: string, projectAbstract: string, score: number): Promise<string>;
}
