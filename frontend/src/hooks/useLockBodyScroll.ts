import { useEffect } from "react";

/**
 * Module-level lock count so multiple concurrent lockers (e.g. the mobile drawer
 * with a modal opened on top of it) compose correctly. The body is unlocked only
 * once the last locker releases — a per-hook snapshot/restore would otherwise let
 * one release clobber another and leave the body stuck at `overflow: hidden`.
 */
let lockCount = 0;
let originalOverflow = "";

function acquire(): void {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function release(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}

/** Prevent body scroll while `locked` is true (e.g. open mobile drawer). */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    acquire();
    return release;
  }, [locked]);
}
