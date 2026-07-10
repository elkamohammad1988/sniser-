import { describe, it, expect, vi, afterEach } from "vitest";
import { api, ApiClientError } from "./client";

/** Minimal Response stub good enough for the client (only `.text()` is read). */
function stubFetch(init: { status: number; body?: string; statusText?: string }) {
  const res = {
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    statusText: init.statusText ?? "",
    text: async () => init.body ?? "",
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api client envelope handling", () => {
  it("resolves a 204 No Content (empty body) to null instead of throwing", async () => {
    // Regression: DELETE endpoints (resale cancel, delete release) 204 with no
    // body — the client must not treat that as a malformed envelope.
    stubFetch({ status: 204, body: "" });
    await expect(api.delete("/resale/abc")).resolves.toBeNull();
  });

  it("preserves the real status when a gateway returns a non-JSON error page", async () => {
    // Regression: an HTML 502 must surface as a 502 HTTP_ERROR, not a bogus
    // NETWORK_ERROR from a JSON parse failure.
    stubFetch({ status: 502, statusText: "Bad Gateway", body: "<html>502 Bad Gateway</html>" });
    await expect(api.get("/health")).rejects.toMatchObject({ status: 502, code: "HTTP_ERROR" });
  });

  it("unwraps a normal success envelope to its data", async () => {
    stubFetch({ status: 200, body: JSON.stringify({ success: true, data: { ok: 1 } }) });
    await expect(api.get("/thing")).resolves.toEqual({ ok: 1 });
  });

  it("throws a typed ApiClientError carrying the server error code", async () => {
    stubFetch({
      status: 422,
      body: JSON.stringify({ success: false, error: { code: "VALIDATION_ERROR", message: "bad" } }),
    });
    await expect(api.post("/thing", {})).rejects.toBeInstanceOf(ApiClientError);
    await expect(api.post("/thing", {})).rejects.toMatchObject({ status: 422, code: "VALIDATION_ERROR" });
  });
});
