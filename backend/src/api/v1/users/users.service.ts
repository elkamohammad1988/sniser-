import fs from "node:fs";
import path from "node:path";
import { db } from "../../../db";
import { env } from "../../../config/env";
import { nowIso } from "../../../utils/datetime";
import { ApiError } from "../../../utils/ApiError";
import { logger } from "../../../utils/logger";
import { writeAudit } from "../../../services/audit";
import { findUserById, toPublicUser, type PublicUser } from "../../../services/users";
import { getArtistByUser } from "../artists/artists.service";

export interface ProfilePatch {
  name?: string;
  avatarUrl?: string;
}

/**
 * Best-effort deletion of a superseded avatar file so replaced uploads don't
 * accumulate on disk (and stop being publicly retrievable). Only ever touches
 * files under `<uploadDir>/avatars`; anything else (seed/external URLs, a path
 * that escapes the dir) is ignored.
 */
function deleteAvatarFile(url: string | null | undefined): void {
  if (!url) return;
  const marker = "/uploads/avatars/";
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const filename = path.basename(url.slice(idx + marker.length));
  if (!filename) return;
  const avatarsDir = path.resolve(env.uploadDir, "avatars");
  const filePath = path.resolve(avatarsDir, filename);
  if (path.dirname(filePath) !== avatarsDir) return; // traversal guard
  fs.rm(filePath, { force: true }, (err) => {
    if (err) logger.warn({ err, filePath }, "failed to delete superseded avatar");
  });
}

export function updateProfile(userId: string, patch: ProfilePatch, ip?: string | null): PublicUser {
  const user = findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const name = patch.name ?? user.name;
  const avatarUrl = patch.avatarUrl ?? user.avatar_url;
  db.prepare("UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?").run(
    name,
    avatarUrl,
    nowIso(),
    userId
  );
  // Keep the artist display avatar in sync when a profile photo is set.
  if (patch.avatarUrl) {
    db.prepare("UPDATE artist_profiles SET avatar_url = ?, updated_at = ? WHERE user_id = ?").run(
      patch.avatarUrl,
      nowIso(),
      userId
    );
  }

  // Remove the previous avatar file once the new one is committed.
  if (patch.avatarUrl && user.avatar_url && patch.avatarUrl !== user.avatar_url) {
    deleteAvatarFile(user.avatar_url);
  }

  writeAudit({ actorId: userId, action: "user.update_profile", targetType: "user", targetId: userId, ip });
  const updated = findUserById(userId)!;
  return toPublicUser(updated);
}

/** Full "who am I" payload: account + artist flag. */
export function getAccount(userId: string): { user: PublicUser; isArtist: boolean } {
  const user = findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return { user: toPublicUser(user), isArtist: Boolean(getArtistByUser(userId)) };
}
