import "express";

export interface AuthUser {
  id: string;
  email?: string;
  /** Single role: viewer | artist | admin. */
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Per-request correlation id, set by the requestId middleware. */
      id?: string;
      /** Populated by requireAuth / optionalAuth when a valid JWT is present. */
      user?: AuthUser;
    }
  }
}

export {};
