import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp, type TestContext } from "./helpers/app";
import { signup, bearer } from "./helpers/api";

/**
 * Token-gated media streaming. An owner can stream their purchased drop (with
 * HTTP Range for seeking), but the raw file is never public and a media token
 * is bound to one content id, one user, and a short lifetime.
 */
describe("media streaming: token-gated, range-capable, ownership-checked", () => {
  let ctx: TestContext;
  let artistToken: string;
  let contentId: string;

  // 2 KB of deterministic bytes we can slice-compare after streaming.
  const MEDIA = Buffer.from(Array.from({ length: 2048 }, (_, i) => i % 256));

  // Collect an arbitrary (non-JSON) response body as a Buffer.
  const binaryParser = (
    res: import("node:http").IncomingMessage,
    cb: (err: Error | null, body: Buffer) => void
  ) => {
    const chunks: Buffer[] = [];
    res.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    res.on("end", () => cb(null, Buffer.concat(chunks)));
  };

  before(async () => {
    ctx = await createTestApp();

    const artist = await signup(ctx.app, { name: "Nova Reign" });
    artistToken = artist.token;
    await request(ctx.app)
      .post("/api/v1/artists/apply")
      .set(bearer(artistToken))
      .send({ handle: `nova${Date.now().toString().slice(-6)}`, displayName: "Nova Reign" })
      .expect(201);

    // Publish an audio release WITH a media file attached.
    const create = await request(ctx.app)
      .post("/api/v1/artists/me/releases")
      .set(bearer(artistToken))
      .field("title", "Velvet Static")
      .field("category", "audio")
      .field("price", "5")
      .attach("media", MEDIA, { filename: "clip.mp3", contentType: "audio/mpeg" });
    assert.equal(create.status, 201);
    contentId = create.body.data.release.id;

    await request(ctx.app)
      .post(`/api/v1/artists/me/releases/${contentId}/status`)
      .set(bearer(artistToken))
      .send({ status: "published" })
      .expect(200);
  });

  after(() => ctx.cleanup());

  async function buyAndGetAccess() {
    const buyer = await signup(ctx.app, { name: "Buyer" });
    await request(ctx.app)
      .post("/api/v1/wallet/deposit")
      .set(bearer(buyer.token))
      .send({ amount: 10 })
      .expect(200);
    await request(ctx.app)
      .post("/api/v1/purchases")
      .set(bearer(buyer.token))
      .send({ contentId })
      .expect(201);
    const access = await request(ctx.app)
      .get(`/api/v1/purchases/${contentId}/access`)
      .set(bearer(buyer.token));
    assert.equal(access.status, 200);
    return { buyer, access: access.body.data.access };
  }

  test("access returns a signed /media stream URL and the media kind (not the raw path)", async () => {
    const { access } = await buyAndGetAccess();
    assert.equal(access.contentId, contentId);
    assert.equal(access.kind, "audio");
    assert.match(access.mediaUrl, /^\/media\//);
    assert.doesNotMatch(access.mediaUrl, /uploads/); // raw path never leaks
    assert.match(access.mediaUrl, /token=/);
  });

  test("an owner streams the whole file with the right content-type and no-store", async () => {
    const { access } = await buyAndGetAccess();
    const res = await request(ctx.app).get(access.mediaUrl).buffer().parse(binaryParser);
    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /audio\/mpeg/);
    assert.equal(res.headers["accept-ranges"], "bytes");
    assert.match(res.headers["cache-control"], /no-store/);
    assert.equal(Number(res.headers["content-length"]), MEDIA.length);
    assert.ok(res.body.equals(MEDIA), "streamed bytes match the uploaded file");
  });

  test("a Range request returns 206 with exactly the requested slice", async () => {
    const { access } = await buyAndGetAccess();
    const res = await request(ctx.app)
      .get(access.mediaUrl)
      .set("Range", "bytes=0-9")
      .buffer()
      .parse(binaryParser);
    assert.equal(res.status, 206);
    assert.equal(res.headers["content-range"], `bytes 0-9/${MEDIA.length}`);
    assert.equal(Number(res.headers["content-length"]), 10);
    assert.ok(res.body.equals(MEDIA.subarray(0, 10)), "sliced bytes match");
  });

  test("a suffix Range (last N bytes) returns 206 with the tail", async () => {
    const { access } = await buyAndGetAccess();
    const res = await request(ctx.app)
      .get(access.mediaUrl)
      .set("Range", "bytes=-100")
      .buffer()
      .parse(binaryParser);
    assert.equal(res.status, 206);
    assert.equal(Number(res.headers["content-length"]), 100);
    assert.ok(res.body.equals(MEDIA.subarray(MEDIA.length - 100)));
  });

  test("an out-of-bounds Range is rejected with 416", async () => {
    const { access } = await buyAndGetAccess();
    const res = await request(ctx.app).get(access.mediaUrl).set("Range", `bytes=${MEDIA.length}-`);
    assert.equal(res.status, 416);
    assert.equal(res.headers["content-range"], `bytes */${MEDIA.length}`);
  });

  test("a missing or tampered token is rejected with 401", async () => {
    const { access } = await buyAndGetAccess();
    // no token
    await request(ctx.app).get(`/media/${contentId}`).expect(401);
    // flip the last character of the signature
    const tampered = access.mediaUrl.slice(0, -1) + (access.mediaUrl.endsWith("A") ? "B" : "A");
    const res = await request(ctx.app).get(tampered);
    assert.equal(res.status, 401);
  });

  test("a valid token cannot be replayed against a different content id", async () => {
    const { access } = await buyAndGetAccess();
    const token = new URL(`http://x${access.mediaUrl}`).searchParams.get("token");
    const other = "00000000-0000-4000-8000-000000000000";
    const res = await request(ctx.app).get(`/media/${other}?token=${encodeURIComponent(token!)}`);
    assert.equal(res.status, 401);
  });

  test("a non-owner cannot even mint a token (access is 403)", async () => {
    const stranger = await signup(ctx.app, { name: "Stranger" });
    await request(ctx.app)
      .get(`/api/v1/purchases/${contentId}/access`)
      .set(bearer(stranger.token))
      .expect(403);
  });

  test("raw media is never served statically from /uploads/media", async () => {
    const res = await request(ctx.app).get("/uploads/media/clip.mp3");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });
});
