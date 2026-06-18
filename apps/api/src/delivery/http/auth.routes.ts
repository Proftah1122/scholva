import { Router } from "express";
import { z } from "zod";
import { UserType } from "@scholva/shared-types";
import type { Container } from "../../container.js";
import { asyncHandler } from "./async-handler.js";
import { parseBody } from "./validation.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  userType: z.nativeEnum(UserType)
});

const verifyEmailSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32)
});

export function createAuthRouter(container: Container): Router {
  const router = Router();

  router.post("/auth/register", asyncHandler(async (req, res) => {
    const input = parseBody(registerSchema, req);
    const output = await container.authService.register(input);
    res.status(201).json(output);
  }));

  router.post("/auth/verify-email", asyncHandler(async (req, res) => {
    const input = parseBody(verifyEmailSchema, req);
    const output = await container.authService.verifyEmail(input);
    res.json(output);
  }));

  router.post("/auth/login", asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req);
    const output = await container.authService.login(input);
    res.json(output);
  }));

  router.post("/auth/refresh", asyncHandler(async (req, res) => {
    const input = parseBody(refreshSchema, req);
    const output = await container.authService.refresh(input.refreshToken);
    res.json(output);
  }));

  router.post("/auth/logout", asyncHandler(async (req, res) => {
    const input = parseBody(refreshSchema, req);
    const output = await container.authService.logout(input.refreshToken);
    res.json(output);
  }));

  return router;
}
