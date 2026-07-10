import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import type { Application } from "express";
import { createTestApp, type TestContext } from "./helpers/app";
import { signup, bearer } from "./helpers/api";

/**
 * Edge-case & invariant coverage for the marketplace money flow. Each test here
 * pins a bug that a naive implementation gets wrong:
 *  - resale must not consume primary supply,
 *  - supply must still be enforced on primary sales,
 *  - a free (price 0) release must be acquirable without funds,
 *  - a pass must be re-listable after a listing is cancelled,
 *  - sub-cent money amounts must fail validation cleanly (422), not 400/500.
 */

let seq = 0;

/** Onboard an artist and publish a release; returns the artist token + content id. */
async function publishRelease(
  app: Application,
  opts: { price: number; supply?: number }
): Promise<{ token: string; contentId: string }> {
  seq += 1;
  const artist = await signup(app, { name: `Edge Artist ${seq}` });
  const apply = await request(app)
    .post("/api/v1/artists/apply")
    .set(bearer(artist.token))
    .send({ handle: `edge${seq}x${Date.now().toString().slice(-5)}`, displayName: `Edge Artist ${seq}` });
  assert.equal(apply.status, 201, `apply failed: ${JSON.stringify(apply.body)}`);

  const body: Record<string, unknown> = { title: `Edge Release ${seq}`, category: "audio", price: opts.price };
  if (opts.supply !== undefined) body.supply = opts.supply;
  const create = await request(app)
    .post("/api/v1/artists/me/releases")
    .set(bearer(artist.token))
    .send(body);
  assert.equal(create.status, 201, `create failed: ${JSON.stringify(create.body)}`);
  const contentId = create.body.data.release.id as string;

  const publish = await request(app)
    .post(`/api/v1/artists/me/releases/${contentId}/status`)
    .set(bearer(artist.token))
    .send({ status: "published" });
  assert.equal(publish.status, 200, `publish failed: ${JSON.stringify(publish.body)}`);
  return { token: artist.token, contentId };
}

async function fund(app: Application, token: string, amount: number): Promise<void> {
  const res = await request(app).post("/api/v1/wallet/deposit").set(bearer(token)).send({ amount });
  assert.equal(res.status, 200, `deposit failed: ${JSON.stringify(res.body)}`);
}

async function buy(app: Application, token: string, contentId: string) {
  return request(app).post("/api/v1/purchases").set(bearer(token)).send({ contentId });
}

async function firstPurchaseId(app: Application, token: string): Promise<string> {
  const lib = await request(app).get("/api/v1/purchases").set(bearer(token));
  assert.equal(lib.status, 200);
  return lib.body.data.items[0].id as string;
}

describe("marketplace edge cases & invariants", () => {
  let ctx: TestContext;
  before(async () => {
    ctx = await createTestApp();
  });
  after(() => ctx.cleanup());

  test("a resale does not consume primary supply", async () => {
    // supply = 2. One primary sale + one resale must still leave the 2nd unit
    // buyable — a resold pass is a transfer, not a consumed unit of supply.
    const { contentId } = await publishRelease(ctx.app, { price: 5, supply: 2 });

    const a = await signup(ctx.app, { name: "Supply A" });
    await fund(ctx.app, a.token, 20);
    assert.equal((await buy(ctx.app, a.token, contentId)).status, 201);

    const aPurchaseId = await firstPurchaseId(ctx.app, a.token);
    const listing = await request(ctx.app)
      .post("/api/v1/resale")
      .set(bearer(a.token))
      .send({ purchaseId: aPurchaseId, price: 6 });
    assert.equal(listing.status, 201);

    const c = await signup(ctx.app, { name: "Supply C" });
    await fund(ctx.app, c.token, 20);
    const resaleBuy = await request(ctx.app)
      .post(`/api/v1/resale/${listing.body.data.listing.id}/buy`)
      .set(bearer(c.token));
    assert.equal(resaleBuy.status, 201);

    // Exactly one live pass exists (C's). The untouched 2nd primary unit must sell.
    const b = await signup(ctx.app, { name: "Supply B" });
    await fund(ctx.app, b.token, 20);
    const bBuy = await buy(ctx.app, b.token, contentId);
    assert.equal(bBuy.status, 201, `2nd primary unit should still be available: ${JSON.stringify(bBuy.body)}`);
  });

  test("supply is enforced: the buyer past the cap is refused (409)", async () => {
    const { contentId } = await publishRelease(ctx.app, { price: 5, supply: 1 });

    const a = await signup(ctx.app, { name: "SoldOut A" });
    await fund(ctx.app, a.token, 20);
    assert.equal((await buy(ctx.app, a.token, contentId)).status, 201);

    const b = await signup(ctx.app, { name: "SoldOut B" });
    await fund(ctx.app, b.token, 20);
    const bBuy = await buy(ctx.app, b.token, contentId);
    assert.equal(bBuy.status, 409, `expected sold out: ${JSON.stringify(bBuy.body)}`);
  });

  test("a free release (price 0) is acquirable without funds and grants access", async () => {
    const { contentId } = await publishRelease(ctx.app, { price: 0 });

    const buyer = await signup(ctx.app, { name: "Freeloader" });
    const res = await buy(ctx.app, buyer.token, contentId);
    assert.equal(res.status, 201, `free purchase should succeed: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.data.balance, 0);

    const access = await request(ctx.app)
      .get(`/api/v1/purchases/${contentId}/access`)
      .set(bearer(buyer.token));
    assert.equal(access.status, 200);
    assert.equal(access.body.data.access.contentId, contentId);
  });

  test("a pass can be re-listed after its previous listing is cancelled", async () => {
    const { contentId } = await publishRelease(ctx.app, { price: 5 });

    const owner = await signup(ctx.app, { name: "Relister" });
    await fund(ctx.app, owner.token, 20);
    assert.equal((await buy(ctx.app, owner.token, contentId)).status, 201);
    const purchaseId = await firstPurchaseId(ctx.app, owner.token);

    const first = await request(ctx.app)
      .post("/api/v1/resale")
      .set(bearer(owner.token))
      .send({ purchaseId, price: 7 });
    assert.equal(first.status, 201);

    const cancel = await request(ctx.app)
      .delete(`/api/v1/resale/${first.body.data.listing.id}`)
      .set(bearer(owner.token));
    assert.equal(cancel.status, 204);

    const relist = await request(ctx.app)
      .post("/api/v1/resale")
      .set(bearer(owner.token))
      .send({ purchaseId, price: 8 });
    assert.equal(relist.status, 201, `re-list after cancel should succeed: ${JSON.stringify(relist.body)}`);
    assert.equal(relist.body.data.listing.price, 8);
  });

  test("a sub-cent deposit is rejected with a clean 422", async () => {
    const u = await signup(ctx.app, { name: "Dust Depositor" });
    const res = await request(ctx.app)
      .post("/api/v1/wallet/deposit")
      .set(bearer(u.token))
      .send({ amount: 0.004 });
    assert.equal(res.status, 422, `expected validation error: ${JSON.stringify(res.body)}`);
  });

  test("a resale listing priced below one cent is rejected with a clean 422", async () => {
    const { contentId } = await publishRelease(ctx.app, { price: 5 });
    const owner = await signup(ctx.app, { name: "Underpricer" });
    await fund(ctx.app, owner.token, 20);
    assert.equal((await buy(ctx.app, owner.token, contentId)).status, 201);
    const purchaseId = await firstPurchaseId(ctx.app, owner.token);

    const res = await request(ctx.app)
      .post("/api/v1/resale")
      .set(bearer(owner.token))
      .send({ purchaseId, price: 0.004 });
    assert.equal(res.status, 422, `expected validation error: ${JSON.stringify(res.body)}`);
  });
});
