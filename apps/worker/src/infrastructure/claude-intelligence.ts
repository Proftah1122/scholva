export interface TopicDraft {
  readonly title: string;
  readonly rationale: string;
  readonly relatedProblemId: string | null;
  readonly discipline: string;
}

export interface ProjectTagDraft {
  readonly discipline: string;
  readonly problemDomain: string;
  readonly methodology: string;
  readonly keywords: readonly string[];
}

export class ClaudeIntelligence {
  private static readonly MODEL = "claude-sonnet-4-6";

  constructor(private readonly apiKey: string | undefined) {}

  async generateTopicSuggestions(params: {
    readonly scholarDiscipline: string;
    readonly graduationYear: number;
    readonly openProblems: readonly { readonly id: string; readonly title: string; readonly description: string; readonly sector: string }[];
    readonly count: number;
  }): Promise<readonly TopicDraft[]> {
    if (this.apiKey === undefined || this.apiKey.length === 0) {
      return fallbackTopics(params.scholarDiscipline, params.openProblems, params.count);
    }

    const problemsXml = params.openProblems.map((problem) =>
      `<problem id="${escapeXml(problem.id)}"><title>${escapeXml(problem.title)}</title><description>${escapeXml(problem.description)}</description><sector>${escapeXml(problem.sector)}</sector></problem>`
    ).join("\n");

    const text = await this.callClaude(
      "You generate concrete thesis topic suggestions for Nigerian university students. Respond only with valid JSON array matching: [{\"title\":string,\"rationale\":string,\"relatedProblemId\":string|null,\"discipline\":string}].",
      `<student_discipline>${escapeXml(params.scholarDiscipline)}</student_discipline>
<graduation_year>${params.graduationYear}</graduation_year>
<open_industry_problems>${problemsXml}</open_industry_problems>
<count>${params.count}</count>`
    );

    return parseJsonArray<TopicDraft>(text, fallbackTopics(params.scholarDiscipline, params.openProblems, params.count));
  }

  async extractTags(title: string, abstract: string): Promise<ProjectTagDraft> {
    if (this.apiKey === undefined || this.apiKey.length === 0) {
      return fallbackTags(title, abstract);
    }

    const text = await this.callClaude(
      "Extract thesis metadata. Respond only with valid JSON: {\"discipline\":string,\"problemDomain\":string,\"methodology\":string,\"keywords\":string[]}.",
      `<title>${escapeXml(title)}</title>\n<abstract>${escapeXml(abstract)}</abstract>`
    );

    return parseJsonObject<ProjectTagDraft>(text, fallbackTags(title, abstract));
  }

  async generateMatchExplanation(problemDescription: string, projectAbstract: string): Promise<string> {
    if (this.apiKey === undefined || this.apiKey.length === 0) {
      return "This project appears relevant because its abstract overlaps with the industry problem and may offer a practical research basis for further engagement.";
    }

    return this.callClaude(
      "Explain in one paragraph why a university research project is relevant to an industry problem. Do not mention similarity scores.",
      `<problem>${escapeXml(problemDescription)}</problem>\n<project>${escapeXml(projectAbstract)}</project>`
    );
  }

  private async callClaude(system: string, content: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: ClaudeIntelligence.MODEL,
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude request failed: ${response.status}`);
    }

    const json = await response.json() as { readonly content?: readonly { readonly type?: string; readonly text?: string }[] };
    return json.content?.find((part) => part.type === "text")?.text ?? "";
  }
}

function fallbackTopics(discipline: string, problems: readonly { readonly id: string; readonly title: string; readonly sector: string }[], count: number): readonly TopicDraft[] {
  const linked = problems.map((problem) => ({
    title: `Applied ${discipline} response to ${problem.title}`,
    rationale: `A concrete final-year project grounded in a live ${problem.sector} industry problem.`,
    relatedProblemId: problem.id,
    discipline
  }));

  const defaults = Array.from({ length: count }, (_value, index) => ({
    title: `${discipline} thesis topic ${index + 1} for Nigerian industry readiness`,
    rationale: `A practical ${discipline} topic scoped for one academic year and measurable local industry impact.`,
    relatedProblemId: null,
    discipline
  }));

  return [...linked, ...defaults].slice(0, count);
}

function fallbackTags(title: string, abstract: string): ProjectTagDraft {
  const keywords = [...new Set(`${title} ${abstract}`.toLowerCase().split(/[^a-z0-9]+/u).filter((word) => word.length > 4))].slice(0, 8);
  return {
    discipline: "Other",
    problemDomain: keywords[0] ?? "General",
    methodology: "Other",
    keywords
  };
}

function parseJsonArray<T>(text: string, fallback: readonly T[]): readonly T[] {
  try {
    const parsed = JSON.parse(stripFences(text));
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonObject<T>(text: string, fallback: T): T {
  try {
    const parsed = JSON.parse(stripFences(text));
    return typeof parsed === "object" && parsed !== null ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

function stripFences(text: string): string {
  return text.replace(/```json|```/gu, "").trim();
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}
