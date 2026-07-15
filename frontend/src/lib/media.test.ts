import { describe, it, expect } from "vitest";
import { resolveMediaKind } from "./media";

describe("resolveMediaKind", () => {
  it("detects video from the file extension", () => {
    expect(resolveMediaKind("/uploads/media/x.mp4")).toBe("video");
    expect(resolveMediaKind("/uploads/media/x.webm")).toBe("video");
    expect(resolveMediaKind("/uploads/media/x.mov")).toBe("video");
  });

  it("detects audio from the file extension", () => {
    expect(resolveMediaKind("/uploads/media/x.mp3")).toBe("audio");
    expect(resolveMediaKind("/uploads/media/x.m4a")).toBe("audio");
    expect(resolveMediaKind("/uploads/media/x.wav")).toBe("audio");
  });

  it("ignores query strings and fragments when reading the extension", () => {
    expect(resolveMediaKind("https://cdn.x/y.mp4?token=abc")).toBe("video");
    expect(resolveMediaKind("https://cdn.x/y.mp3#t=30")).toBe("audio");
  });

  it("prefers the extension over the category when they disagree", () => {
    expect(resolveMediaKind("/uploads/media/x.mp3", "video")).toBe("audio");
  });

  it("falls back to the category when the URL is opaque", () => {
    expect(resolveMediaKind("/stream/opaque-id", "video")).toBe("video");
    expect(resolveMediaKind("/stream/opaque-id", "audio")).toBe("audio");
  });

  it("treats unknown/unplayable files as a download", () => {
    expect(resolveMediaKind("/uploads/media/x.pdf", "original")).toBe("download");
    expect(resolveMediaKind("/uploads/media/x.zip")).toBe("download");
  });

  it("returns download when there is no media at all", () => {
    expect(resolveMediaKind(null)).toBe("download");
    expect(resolveMediaKind(undefined, "original")).toBe("download");
  });
});
