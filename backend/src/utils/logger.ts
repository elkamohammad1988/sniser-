import pino, { LoggerOptions } from "pino";
import { env } from "../config/env";

const baseOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: { service: "sniser-api", env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password"],
    censor: "[REDACTED]",
  },
};

const transport = env.isDev
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss.l",
        ignore: "pid,hostname,service,env",
        singleLine: false,
      },
    })
  : undefined;

export const logger = transport
  ? pino(baseOptions, transport)
  : pino(baseOptions);

export type Logger = typeof logger;
