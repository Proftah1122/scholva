import type { ConsentLevel, PlanTier, UUID } from "@scholva/shared-types";
import { getDisciplinesForSector, getSectorsForDiscipline } from "@scholva/shared-utils";
import type { PrismaDatabase } from "../../infrastructure/database/prisma-client.js";
import { ApplicationError } from "../shared/application-error.js";

export interface ScholarProfileInput {
  readonly fullName: string;
  readonly institution: string;
  readonly department: string;
  readonly graduationYear: number;
  readonly disciplineFocus: string;
  readonly bio: string | undefined;
  readonly supervisorName: string | undefined;
}

export interface ProjectInput {
  readonly title: string;
  readonly abstract: string;
  readonly discipline: string;
  readonly year: number;
  readonly fileUrl: string;
  readonly consentLevel: ConsentLevel;
  readonly allowsContact: boolean;
  readonly allowsCommercialUse: boolean;
}

export interface CompanyProfileInput {
  readonly name: string;
  readonly sector: string;
  readonly size: string | undefined;
  readonly website: string | undefined;
  readonly description: string | undefined;
  readonly contactEmail: string;
}

export interface ProblemInput {
  readonly title: string;
  readonly description: string;
  readonly sector: string;
  readonly skillsRequired: readonly string[];
  readonly urgency: "LOW" | "MEDIUM" | "HIGH";
  readonly isOpenToStudents: boolean;
}

export class PlatformService {
  constructor(private readonly db: PrismaDatabase) {}

  async upsertScholarProfile(userId: UUID, input: ScholarProfileInput): Promise<{ readonly scholarId: UUID }> {
    const scholar = await this.db.scholar.upsert({
      where: { userId },
      update: {
        fullName: input.fullName,
        institution: input.institution,
        department: input.department,
        graduationYear: input.graduationYear,
        disciplineFocus: input.disciplineFocus,
        bio: input.bio ?? null,
        supervisorName: input.supervisorName ?? null
      },
      create: {
        userId,
        fullName: input.fullName,
        institution: input.institution,
        department: input.department,
        graduationYear: input.graduationYear,
        disciplineFocus: input.disciplineFocus,
        bio: input.bio ?? null,
        supervisorName: input.supervisorName ?? null
      }
    });

    await this.generateSuggestionsForScholar(scholar.id, "SCHOLAR_REGISTERED");
    return { scholarId: scholar.id };
  }

  async getScholarProfile(userId: UUID): Promise<unknown> {
    return this.db.scholar.findUnique({
      where: { userId },
      include: {
        projects: true,
        topicSuggestions: true,
        problemSurfacings: { include: { problem: { include: { company: true } } } }
      }
    });
  }

  async createProject(userId: UUID, input: ProjectInput): Promise<{ readonly projectId: UUID; readonly status: "processing" }> {
    const scholar = await this.requireScholar(userId);
    const project = await this.db.project.create({
      data: {
        scholarId: scholar.id,
        title: input.title,
        abstract: input.abstract,
        discipline: input.discipline,
        year: input.year,
        fileUrl: input.fileUrl,
        consentLevel: input.consentLevel,
        allowsContact: input.allowsContact,
        allowsCommercialUse: input.allowsCommercialUse,
        isPublished: false
      }
    });

    return {
      projectId: project.id,
      status: "processing"
    };
  }

  async markProjectProcessed(projectId: UUID): Promise<{ readonly projectId: UUID; readonly isPublished: true }> {
    const project = await this.db.project.update({
      where: { id: projectId },
      data: {
        isPublished: true,
        fullText: "Processing placeholder: PDF extraction worker will replace this text.",
        tags: {
          create: [
            { tag: "auto-processed", source: "system" }
          ]
        }
      }
    });

    return {
      projectId: project.id,
      isPublished: true
    };
  }

  async listProjects(params: { readonly query?: string; readonly discipline?: string; readonly page: number; readonly pageSize: number }): Promise<unknown> {
    const skip = (params.page - 1) * params.pageSize;
    return this.db.project.findMany({
      where: {
        isPublished: true,
        consentLevel: { not: "PRIVATE" },
        ...(params.discipline === undefined ? {} : { discipline: params.discipline }),
        ...(params.query === undefined ? {} : {
          OR: [
            { title: { contains: params.query, mode: "insensitive" } },
            { abstract: { contains: params.query, mode: "insensitive" } },
            { problemDomain: { contains: params.query, mode: "insensitive" } }
          ]
        })
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.pageSize,
      include: { scholar: true, tags: true }
    });
  }

  async upsertCompanyProfile(userId: UUID, input: CompanyProfileInput): Promise<{ readonly companyId: UUID }> {
    const data = {
      name: input.name,
      sector: input.sector,
      size: input.size ?? null,
      website: input.website ?? null,
      description: input.description ?? null,
      contactEmail: input.contactEmail
    };
    const company = await this.db.company.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    return { companyId: company.id };
  }

  async postProblem(userId: UUID, input: ProblemInput): Promise<{ readonly problemId: UUID; readonly surfacedCount: number }> {
    const company = await this.requireCompany(userId);
    const problem = await this.db.problem.create({
      data: {
        companyId: company.id,
        title: input.title,
        description: input.description,
        sector: input.sector,
        skillsRequired: [...input.skillsRequired],
        urgency: input.urgency,
        isOpenToStudents: input.isOpenToStudents
      }
    });

    const surfacedCount = input.isOpenToStudents ? await this.surfaceProblem(problem.id) : 0;
    return {
      problemId: problem.id,
      surfacedCount
    };
  }

  async listProblems(): Promise<unknown> {
    return this.db.problem.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: true }
    });
  }

  async generateSuggestions(userId: UUID): Promise<{ readonly batchId: UUID; readonly suggestionsCount: number }> {
    const scholar = await this.requireScholar(userId);
    return this.generateSuggestionsForScholar(scholar.id, "WEEKLY_DIGEST");
  }

  async getSuggestions(userId: UUID): Promise<unknown> {
    const scholar = await this.requireScholar(userId);
    return this.db.topicSuggestion.findMany({
      where: { scholarId: scholar.id },
      orderBy: { createdAt: "desc" },
      include: { relatedProblem: { include: { company: true } } }
    });
  }

  async runMatching(problemId: UUID): Promise<{ readonly matchCount: number }> {
    const problem = await this.db.problem.findUnique({ where: { id: problemId } });
    if (problem === null) {
      throw this.notFound("Problem not found.");
    }

    const projects = await this.db.project.findMany({
      where: {
        isPublished: true,
        allowsContact: true,
        consentLevel: { not: "PRIVATE" }
      },
      take: 50
    });

    let matchCount = 0;
    for (const project of projects) {
      const score = lexicalScore(`${problem.title} ${problem.description}`, `${project.title} ${project.abstract}`);
      if (score < 0.2) {
        continue;
      }

      await this.db.match.upsert({
        where: {
          problemId_projectId: {
            problemId: problem.id,
            projectId: project.id
          }
        },
        update: {
          similarityScore: score,
          explanation: `This project is relevant because its title and abstract overlap with the industry problem around ${problem.sector}.`
        },
        create: {
          problemId: problem.id,
          projectId: project.id,
          similarityScore: score,
          explanation: `This project is relevant because its title and abstract overlap with the industry problem around ${problem.sector}.`
        }
      });
      matchCount += 1;
    }

    if (matchCount > 0) {
      await this.db.problem.update({ where: { id: problem.id }, data: { status: "MATCHED" } });
    }

    return { matchCount };
  }

  async createContactRequest(input: { readonly companyUserId: UUID; readonly projectId: UUID; readonly message: string }): Promise<{ readonly requestId: UUID }> {
    const company = await this.requireCompany(input.companyUserId);
    const project = await this.db.project.findUnique({ where: { id: input.projectId } });
    if (project === null) {
      throw this.notFound("Project not found.");
    }

    const request = await this.db.contactRequest.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        scholarId: project.scholarId,
        message: input.message
      }
    });

    return { requestId: request.id };
  }

  async listContactRequests(userId: UUID): Promise<unknown> {
    const [company, scholar] = await Promise.all([
      this.db.company.findUnique({ where: { userId } }),
      this.db.scholar.findUnique({ where: { userId } })
    ]);

    return this.db.contactRequest.findMany({
      where: {
        OR: [
          ...(company === null ? [] : [{ companyId: company.id }]),
          ...(scholar === null ? [] : [{ scholarId: scholar.id }])
        ]
      },
      orderBy: { createdAt: "desc" },
      include: { project: true, company: true, scholar: true }
    });
  }

  async activateSubscription(userId: UUID, planTier: PlanTier): Promise<{ readonly subscriptionId: UUID }> {
    const company = await this.requireCompany(userId);
    const now = new Date();
    const subscription = await this.db.subscription.upsert({
      where: { companyId: company.id },
      update: {
        planTier,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: addDays(now, 30)
      },
      create: {
        companyId: company.id,
        planTier,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: addDays(now, 30)
      }
    });

    return { subscriptionId: subscription.id };
  }

  private async generateSuggestionsForScholar(
    scholarId: UUID,
    triggeredBy: "SCHOLAR_REGISTERED" | "PROBLEM_POSTED" | "WEEKLY_DIGEST"
  ): Promise<{ readonly batchId: UUID; readonly suggestionsCount: number }> {
    const scholar = await this.db.scholar.findUnique({ where: { id: scholarId } });
    if (scholar === null) {
      throw this.notFound("Scholar not found.");
    }

    const sectors = getSectorsForDiscipline(scholar.disciplineFocus);
    const problems = await this.db.problem.findMany({
      where: {
        status: "OPEN",
        isOpenToStudents: true,
        sector: { in: [...sectors] }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const batch = await this.db.suggestionBatch.create({
      data: { scholarId, triggeredBy }
    });

    const drafts = problems.length === 0
      ? this.defaultSuggestionDrafts(scholar.disciplineFocus)
      : problems.map((problem) => ({
        title: `Applied ${scholar.disciplineFocus} response to ${problem.title}`,
        rationale: `This topic turns a live ${problem.sector} industry problem into a final-year research project that can be completed in one academic year.`,
        relatedProblemId: problem.id,
        discipline: scholar.disciplineFocus
      }));

    await this.db.topicSuggestion.createMany({
      data: drafts.slice(0, 5).map((draft) => ({
        batchId: batch.id,
        scholarId,
        relatedProblemId: draft.relatedProblemId,
        title: draft.title,
        rationale: draft.rationale,
        discipline: draft.discipline,
        relevanceScore: 0.8
      }))
    });

    return {
      batchId: batch.id,
      suggestionsCount: Math.min(drafts.length, 5)
    };
  }

  private async surfaceProblem(problemId: UUID): Promise<number> {
    const problem = await this.db.problem.findUnique({ where: { id: problemId } });
    if (problem === null) {
      return 0;
    }

    const disciplines = getDisciplinesForSector(problem.sector);
    const currentYear = new Date().getFullYear();
    const scholars = await this.db.scholar.findMany({
      where: {
        disciplineFocus: { in: [...disciplines] },
        graduationYear: { gte: currentYear, lte: currentYear + 1 }
      }
    });

    let surfaced = 0;
    for (const scholar of scholars) {
      await this.db.problemSurfacing.upsert({
        where: {
          scholarId_problemId: {
            scholarId: scholar.id,
            problemId
          }
        },
        update: {},
        create: {
          scholarId: scholar.id,
          problemId,
          relevanceScore: 0.8
        }
      });
      surfaced += 1;
    }

    return surfaced;
  }

  private defaultSuggestionDrafts(discipline: string): readonly {
    readonly title: string;
    readonly rationale: string;
    readonly relatedProblemId: null;
    readonly discipline: string;
  }[] {
    return Array.from({ length: 5 }, (_value, index) => ({
      title: `${discipline} thesis topic ${index + 1} for Nigerian industry readiness`,
      rationale: `A practical ${discipline} research topic designed around measurable local industry constraints and implementable student scope.`,
      relatedProblemId: null,
      discipline
    }));
  }

  private async requireScholar(userId: UUID) {
    const scholar = await this.db.scholar.findUnique({ where: { userId } });
    if (scholar === null) {
      throw this.notFound("Scholar profile not found.");
    }
    return scholar;
  }

  private async requireCompany(userId: UUID) {
    const company = await this.db.company.findUnique({ where: { userId } });
    if (company === null) {
      throw this.notFound("Company profile not found.");
    }
    return company;
  }

  private notFound(detail: string): ApplicationError {
    return new ApplicationError({
      status: 404,
      type: "https://scholva.ng/problems/not-found",
      title: "Not Found",
      detail
    });
  }
}

function lexicalScore(left: string, right: string): number {
  const leftTerms = new Set(tokenize(left));
  const rightTerms = new Set(tokenize(right));
  if (leftTerms.size === 0 || rightTerms.size === 0) {
    return 0;
  }

  const overlap = [...leftTerms].filter((term) => rightTerms.has(term)).length;
  return Number((overlap / Math.max(leftTerms.size, rightTerms.size)).toFixed(5));
}

function tokenize(value: string): readonly string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length > 3);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60_000);
}
