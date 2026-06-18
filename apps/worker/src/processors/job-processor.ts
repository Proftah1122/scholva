import type { Job } from "bullmq";
import { JobName, type UUID } from "@scholva/shared-types";
import { getDisciplinesForSector, getSectorsForDiscipline } from "@scholva/shared-utils";
import type { WorkerConfig } from "../config.js";
import { ClaudeIntelligence } from "../infrastructure/claude-intelligence.js";
import { PdfExtractor } from "../infrastructure/pdf-extractor.js";
import type { PrismaDatabase } from "../infrastructure/prisma-client.js";
import { ResendEmailer } from "../infrastructure/resend-emailer.js";
import { VoyageEmbedder } from "../infrastructure/voyage-embedder.js";

export interface ProcessedJobResult {
  readonly jobId: string;
  readonly jobName: string;
  readonly processed: true;
  readonly idempotencyKey: string;
  readonly affectedCount: number;
}

export interface WorkerServices {
  readonly db: PrismaDatabase;
  readonly embedder: VoyageEmbedder;
  readonly intelligence: ClaudeIntelligence;
  readonly pdfExtractor: PdfExtractor;
  readonly emailer: ResendEmailer;
}

export function createWorkerServices(config: WorkerConfig, db: PrismaDatabase): WorkerServices {
  return {
    db,
    embedder: new VoyageEmbedder(config.VOYAGE_API_KEY),
    intelligence: new ClaudeIntelligence(config.ANTHROPIC_API_KEY),
    pdfExtractor: new PdfExtractor(),
    emailer: new ResendEmailer(config.RESEND_API_KEY, config.RESEND_FROM_EMAIL)
  };
}

export function createScholvaJobProcessor(services: WorkerServices) {
  return async (job: Job): Promise<ProcessedJobResult> => {
    let affectedCount = 0;

    switch (job.name) {
      case JobName.EmbedProject:
        affectedCount = await embedProject(readUuid(job.data, "projectId"), services);
        break;
      case JobName.EmbedProblem:
        affectedCount = await embedProblem(readUuid(job.data, "problemId"), services);
        break;
      case JobName.RunMatch:
        affectedCount = await runMatch(readUuid(job.data, "problemId"), services);
        break;
      case JobName.GenerateSuggestions:
        affectedCount = await generateSuggestions(readUuid(job.data, "scholarId"), services);
        break;
      case JobName.SurfaceProblem:
        affectedCount = await surfaceProblem(readUuid(job.data, "problemId"), services);
        break;
      case JobName.WeeklyDigest:
        affectedCount = await weeklyDigest(services);
        break;
      default:
        throw new Error(`Unsupported job: ${job.name}`);
    }

    return {
      jobId: String(job.id),
      jobName: job.name,
      processed: true,
      idempotencyKey: `${job.queueName}:${job.name}:${String(job.id)}`,
      affectedCount
    };
  };
}

async function embedProject(projectId: UUID, services: WorkerServices): Promise<number> {
  const project = await services.db.project.findUnique({ where: { id: projectId } });
  if (project === null || project.isPublished) {
    return 0;
  }

  const extractedText = await safeExtractPdf(project.fileUrl, services);
  const tags = await services.intelligence.extractTags(project.title, project.abstract);
  await services.db.projectTag.deleteMany({ where: { projectId } });
  await services.db.projectTag.createMany({
    data: tags.keywords.map((tag) => ({ projectId, tag, source: "claude" }))
  });

  const embeddingText = `${project.title}. ${project.abstract}. ${tags.keywords.join(". ")}`;
  const embedding = await services.embedder.embedDocument(embeddingText);
  await services.db.project.update({
    where: { id: projectId },
    data: {
      fullText: extractedText.length > 0 ? extractedText : project.abstract,
      discipline: tags.discipline,
      problemDomain: tags.problemDomain,
      methodology: tags.methodology,
      isPublished: true
    }
  });

  if (embedding !== null) {
    await updateVector(services.db, "projects", "embedding", projectId, embedding);
  }

  return 1;
}

async function embedProblem(problemId: UUID, services: WorkerServices): Promise<number> {
  const problem = await services.db.problem.findUnique({ where: { id: problemId } });
  if (problem === null) {
    return 0;
  }

  const embedding = await services.embedder.embedDocument(`${problem.title}. ${problem.description}. ${problem.skillsRequired.join(". ")}`);
  if (embedding !== null) {
    await updateVector(services.db, "problems", "embedding", problemId, embedding);
  }

  return 1;
}

async function generateSuggestions(scholarId: UUID, services: WorkerServices): Promise<number> {
  const scholar = await services.db.scholar.findUnique({
    where: { id: scholarId },
    include: { user: true }
  });
  if (scholar === null) {
    return 0;
  }

  const sectors = getSectorsForDiscipline(scholar.disciplineFocus);
  const problems = await services.db.problem.findMany({
    where: {
      status: "OPEN",
      isOpenToStudents: true,
      sector: { in: [...sectors] }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const drafts = await services.intelligence.generateTopicSuggestions({
    scholarDiscipline: scholar.disciplineFocus,
    graduationYear: scholar.graduationYear,
    openProblems: problems,
    count: 5
  });

  const batch = await services.db.suggestionBatch.create({
    data: { scholarId, triggeredBy: "WEEKLY_DIGEST" }
  });

  let count = 0;
  for (const draft of drafts.slice(0, 5)) {
    const suggestion = await services.db.topicSuggestion.create({
      data: {
        batchId: batch.id,
        scholarId,
        relatedProblemId: draft.relatedProblemId,
        title: draft.title,
        rationale: draft.rationale,
        discipline: draft.discipline,
        relevanceScore: 0.85
      }
    });
    const embedding = await services.embedder.embedDocument(`${draft.title}. ${draft.rationale}`);
    if (embedding !== null) {
      await updateVector(services.db, "topic_suggestions", "topic_embedding", suggestion.id, embedding);
    }
    count += 1;
  }

  await services.emailer.send(
    scholar.user.email,
    "Your Scholva topic suggestions are ready",
    `<p>Hi ${escapeHtml(scholar.fullName)}, Scholva generated ${count} topic suggestions for you.</p>`
  );

  return count;
}

async function surfaceProblem(problemId: UUID, services: WorkerServices): Promise<number> {
  const problem = await services.db.problem.findUnique({
    where: { id: problemId },
    include: { company: true }
  });
  if (problem === null || !problem.isOpenToStudents) {
    return 0;
  }

  const disciplines = getDisciplinesForSector(problem.sector);
  const currentYear = new Date().getFullYear();
  const scholars = await services.db.scholar.findMany({
    where: {
      disciplineFocus: { in: [...disciplines] },
      graduationYear: { gte: currentYear, lte: currentYear + 1 }
    },
    include: { user: true }
  });

  let count = 0;
  for (const scholar of scholars) {
    await services.db.problemSurfacing.upsert({
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
    await services.emailer.send(
      scholar.user.email,
      "A relevant industry problem is open to students",
      `<p>${escapeHtml(problem.company.name)} posted: ${escapeHtml(problem.title)}</p>`
    );
    count += 1;
  }

  return count;
}

async function runMatch(problemId: UUID, services: WorkerServices): Promise<number> {
  const problem = await services.db.problem.findUnique({
    where: { id: problemId },
    include: { company: { include: { user: true } } }
  });
  if (problem === null) {
    return 0;
  }

  const projects = await services.db.project.findMany({
    where: {
      isPublished: true,
      allowsContact: true,
      consentLevel: { not: "PRIVATE" }
    },
    take: 50
  });

  let count = 0;
  for (const project of projects) {
    const score = lexicalScore(`${problem.title} ${problem.description}`, `${project.title} ${project.abstract}`);
    if (score < 0.2) {
      continue;
    }

    const explanation = await services.intelligence.generateMatchExplanation(problem.description, project.abstract);
    await services.db.match.upsert({
      where: {
        problemId_projectId: {
          problemId,
          projectId: project.id
        }
      },
      update: {
        similarityScore: score,
        explanation
      },
      create: {
        problemId,
        projectId: project.id,
        similarityScore: score,
        explanation
      }
    });
    count += 1;
  }

  if (count > 0) {
    await services.db.problem.update({ where: { id: problemId }, data: { status: "MATCHED" } });
  }

  await services.emailer.send(
    problem.company.user.email,
    "Scholva matching completed",
    `<p>${count} matching projects were found for ${escapeHtml(problem.title)}.</p>`
  );

  return count;
}

async function weeklyDigest(services: WorkerServices): Promise<number> {
  const currentYear = new Date().getFullYear();
  const scholars = await services.db.scholar.findMany({
    where: { graduationYear: { gte: currentYear, lte: currentYear + 1 } },
    take: 500
  });

  let count = 0;
  for (const scholar of scholars) {
    count += await generateSuggestions(scholar.id, services);
  }

  return count;
}

async function safeExtractPdf(fileUrl: string, services: WorkerServices): Promise<string> {
  try {
    return await services.pdfExtractor.extractFromUrl(fileUrl);
  } catch {
    return "";
  }
}

async function updateVector(db: PrismaDatabase, tableName: "projects" | "problems" | "topic_suggestions", columnName: "embedding" | "topic_embedding", id: UUID, embedding: readonly number[]): Promise<void> {
  const vector = `[${embedding.join(",")}]`;
  await db.$executeRawUnsafe(`UPDATE ${tableName} SET ${columnName} = $1::vector WHERE id = $2::uuid`, vector, id);
}

function readUuid(data: unknown, key: string): UUID {
  if (typeof data !== "object" || data === null) {
    throw new Error(`Missing job payload: ${key}`);
  }

  const value = (data as Record<string, unknown>)[key];
  if (typeof value !== "string") {
    throw new Error(`Missing job payload: ${key}`);
  }

  return value;
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
