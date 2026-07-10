import { env } from "../../../config/env";

export interface HealthStatus {
  status: "ok";
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  environment: string;
  details?: {
    memory: NodeJS.MemoryUsage;
    nodeVersion: string;
    platform: string;
  };
}

class HealthService {
  private readonly startedAt = Date.now();

  getStatus(verbose = false): HealthStatus {
    const base: HealthStatus = {
      status: "ok",
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      environment: env.NODE_ENV,
    };
    if (!verbose) return base;
    return {
      ...base,
      details: {
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }
}

export const healthService = new HealthService();
