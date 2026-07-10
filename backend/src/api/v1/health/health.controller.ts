import { Request, Response } from "express";
import { healthService } from "./health.service";
import { sendOk } from "../../../utils/ApiResponse";
import type { HealthQuery } from "./health.schema";

export const healthController = {
  get(req: Request, res: Response): Response {
    const { verbose } = req.query as unknown as HealthQuery;
    const data = healthService.getStatus(Boolean(verbose));
    return sendOk(res, data);
  },
};
