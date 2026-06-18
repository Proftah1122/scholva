import { createHash } from "node:crypto";
import { Router } from "express";
import type { Container } from "../../container.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "./async-handler.js";
import { ProblemDetailError } from "./problem-detail-error.js";

export function createUploadRouter(container: Container): Router {
  const router = Router();

  router.post("/uploads/cloudinary/signature", authenticate(container.tokenIssuer), asyncHandler(async (_req, res) => {
    const cloudName = container.config.CLOUDINARY_CLOUD_NAME;
    const apiKey = container.config.CLOUDINARY_API_KEY;
    const apiSecret = container.config.CLOUDINARY_API_SECRET;
    if (cloudName === undefined || apiKey === undefined || apiSecret === undefined) {
      throw new ProblemDetailError({
        type: "https://scholva.ng/problems/cloudinary-not-configured",
        title: "Cloudinary Not Configured",
        status: 503,
        detail: "Cloudinary credentials are not configured on this API server."
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "scholva/projects";
    const resourceType = "raw";
    const signatureBase = `folder=${folder}&resource_type=${resourceType}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(signatureBase).digest("hex");

    res.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      resourceType,
      signature
    });
  }));

  return router;
}
