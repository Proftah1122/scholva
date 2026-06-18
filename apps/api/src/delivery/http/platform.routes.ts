import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { ConsentLevel, PlanTier } from "@scholva/shared-types";
import type { Container } from "../../container.js";
import { authenticate, getAuth } from "../middleware/authenticate.js";
import { asyncHandler } from "./async-handler.js";
import { parseBody } from "./validation.js";
import { ProblemDetailError } from "./problem-detail-error.js";

const scholarProfileSchema = z.object({
  fullName: z.string().min(2),
  institution: z.string().min(2),
  department: z.string().min(2),
  graduationYear: z.number().int().min(2000).max(2100),
  disciplineFocus: z.string().min(2),
  bio: z.string().max(2000).optional(),
  supervisorName: z.string().max(200).optional()
});

const projectSchema = z.object({
  title: z.string().min(5),
  abstract: z.string().min(20),
  discipline: z.string().min(2),
  year: z.number().int().min(2000).max(2100),
  fileUrl: z.string().url(),
  consentLevel: z.nativeEnum(ConsentLevel),
  allowsContact: z.boolean().default(true),
  allowsCommercialUse: z.boolean().default(false)
});

const companyProfileSchema = z.object({
  name: z.string().min(2),
  sector: z.string().min(2),
  size: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().max(3000).optional(),
  contactEmail: z.string().email()
});

const problemSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  sector: z.string().min(2),
  skillsRequired: z.array(z.string().min(1)).default([]),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  isOpenToStudents: z.boolean().default(false)
});

const contactRequestSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(10).max(2000)
});

const subscriptionSchema = z.object({
  planTier: z.nativeEnum(PlanTier)
});

const initiateSubscriptionSchema = subscriptionSchema.extend({
  callbackUrl: z.string().url()
});

export function createPlatformRouter(container: Container): Router {
  const router = Router();
  const requireAuth = authenticate(container.tokenIssuer);

  router.put("/scholar/profile", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(scholarProfileSchema, req);
    const output = await container.platformService.upsertScholarProfile(auth.userId, {
      fullName: input.fullName,
      institution: input.institution,
      department: input.department,
      graduationYear: input.graduationYear,
      disciplineFocus: input.disciplineFocus,
      bio: input.bio,
      supervisorName: input.supervisorName
    });
    res.json(output);
  }));

  router.get("/scholar/me", requireAuth, asyncHandler(async (_req, res) => {
    const auth = getAuth(res);
    res.json(await container.platformService.getScholarProfile(auth.userId));
  }));

  router.post("/projects", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(projectSchema, req);
    const output = await container.platformService.createProject(auth.userId, {
      title: input.title,
      abstract: input.abstract,
      discipline: input.discipline,
      year: input.year,
      fileUrl: input.fileUrl,
      consentLevel: input.consentLevel,
      allowsContact: input.allowsContact ?? true,
      allowsCommercialUse: input.allowsCommercialUse ?? false
    });
    res.status(201).json(output);
  }));

  router.post("/projects/:projectId/process", requireAuth, asyncHandler(async (req, res) => {
    const projectId = parseUuid(readPathParam(req.params["projectId"]));
    res.json(await container.platformService.markProjectProcessed(projectId));
  }));

  router.get("/projects", asyncHandler(async (req, res) => {
    const query = readOptionalQuery(req.query["query"]);
    const discipline = readOptionalQuery(req.query["discipline"]);
    const page = readPositiveInt(req.query["page"], 1);
    const pageSize = Math.min(readPositiveInt(req.query["pageSize"], 20), 100);
    res.json(await container.platformService.listProjects({
      ...(query === undefined ? {} : { query }),
      ...(discipline === undefined ? {} : { discipline }),
      page,
      pageSize
    }));
  }));

  router.put("/company/profile", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(companyProfileSchema, req);
    const output = await container.platformService.upsertCompanyProfile(auth.userId, {
      name: input.name,
      sector: input.sector,
      size: input.size,
      website: input.website,
      description: input.description,
      contactEmail: input.contactEmail
    });
    res.json(output);
  }));

  router.get("/problems", asyncHandler(async (_req, res) => {
    res.json(await container.platformService.listProblems());
  }));

  router.post("/problems", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(problemSchema, req);
    const output = await container.platformService.postProblem(auth.userId, {
      title: input.title,
      description: input.description,
      sector: input.sector,
      skillsRequired: input.skillsRequired ?? [],
      urgency: input.urgency ?? "MEDIUM",
      isOpenToStudents: input.isOpenToStudents ?? false
    });
    res.status(201).json(output);
  }));

  router.post("/suggestions/generate", requireAuth, asyncHandler(async (_req, res) => {
    const auth = getAuth(res);
    res.json(await container.platformService.generateSuggestions(auth.userId));
  }));

  router.get("/suggestions", requireAuth, asyncHandler(async (_req, res) => {
    const auth = getAuth(res);
    res.json(await container.platformService.getSuggestions(auth.userId));
  }));

  router.post("/matching/run/:problemId", requireAuth, asyncHandler(async (req, res) => {
    res.json(await container.platformService.runMatching(parseUuid(readPathParam(req.params["problemId"]))));
  }));

  router.post("/contact-requests", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(contactRequestSchema, req);
    const output = await container.platformService.createContactRequest({
      companyUserId: auth.userId,
      projectId: input.projectId,
      message: input.message
    });
    res.status(201).json(output);
  }));

  router.get("/contact-requests", requireAuth, asyncHandler(async (_req, res) => {
    const auth = getAuth(res);
    res.json(await container.platformService.listContactRequests(auth.userId));
  }));

  router.post("/subscriptions/mock-activate", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(subscriptionSchema, req);
    res.json(await container.platformService.activateSubscription(auth.userId, input.planTier));
  }));

  router.post("/subscriptions/initiate", requireAuth, asyncHandler(async (req, res) => {
    const auth = getAuth(res);
    const input = parseBody(initiateSubscriptionSchema, req);
    res.json(await container.platformService.initiateSubscription(auth.userId, input.planTier, input.callbackUrl));
  }));

  router.post("/subscriptions/paystack/webhook", asyncHandler(async (req, res) => {
    const secret = container.config.PAYSTACK_WEBHOOK_SECRET;
    if (secret === undefined || secret.length === 0) {
      throw new ProblemDetailError({
        type: "https://scholva.ng/problems/paystack-webhook-not-configured",
        title: "Paystack Webhook Not Configured",
        status: 503,
        detail: "Paystack webhook secret is not configured."
      });
    }

    const rawBody = (req as typeof req & { rawBody?: string }).rawBody ?? "";
    const signature = req.header("x-paystack-signature") ?? "";
    if (!isValidPaystackSignature(rawBody, signature, secret)) {
      throw new ProblemDetailError({
        type: "https://scholva.ng/problems/invalid-webhook-signature",
        title: "Invalid Webhook Signature",
        status: 401,
        detail: "Webhook signature verification failed."
      });
    }

    const body = req.body as {
      readonly event?: string;
      readonly data?: {
        readonly metadata?: {
          readonly companyId?: string;
          readonly planTier?: PlanTier;
        };
      };
    };
    if (body.event === "charge.success" && body.data?.metadata?.companyId !== undefined && body.data.metadata.planTier !== undefined) {
      await container.platformService.activateSubscriptionForCompany(body.data.metadata.companyId, body.data.metadata.planTier);
    }

    res.json({ received: true });
  }));

  return router;
}

function isValidPaystackSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function parseUuid(value: string | undefined): string {
  const result = z.string().uuid().safeParse(value);
  if (!result.success) {
    throw new ProblemDetailError({
      type: "https://scholva.ng/problems/invalid-path-parameter",
      title: "Invalid Path Parameter",
      status: 400,
      detail: "A valid UUID path parameter is required."
    });
  }
  return result.data;
}

function readPathParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readOptionalQuery(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
