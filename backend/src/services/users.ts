import { db } from "../db";

export type UserRole = "viewer" | "artist" | "admin";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  status: "active" | "suspended";
  email_verified: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    emailVerified: row.email_verified === 1,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}
