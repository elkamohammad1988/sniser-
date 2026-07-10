import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp, type TestContext } from "./helpers/app";
import { signup, bearer } from "./helpers/api";

/**
 * End-to-end money flow: an artist publishes a release, a buyer deposits and
 * buys it (verifying fee math + balance), then resells it to a second buyer
 * (verifying the resale commission and that funds land in the right wallets).
 */
describe("marketplace: purchase + resale money flow", () => {
  let ctx: TestContext;
  let artistToken: string;
  let contentId: string;

  before(async () => {
    ctx = await createTestApp();

    // Artist onboards and publishes a $10.00 release.
    const artist = await signup(ctx.app, { name: "Nova Reign" });
    artistToken = artist.token;
    const apply = await request(ctx.app)
      .post("/api/v1/artists/apply")
      .set(bearer(artistToken))
      .send({ handle: `nova${Date.now().toString().slice(-6)}`, displayName: "Nova Reign" });
    assert.equal(apply.status, 201);

    const create = await request(ctx.app)
      .post("/api/v1/artists/me/releases")
      .set(bearer(artistToken))
      .send({ title: "Neon Skyline", category: "audio", price: 10 });
    assert.equal(create.status, 201);
    contentId = create.body.data.release.id;
    assert.ok(contentId, "expected a release id");

    const publish = await request(ctx.app)
      .post(`/api/v1/artists/me/releases/${contentId}/status`)
      .set(bearer(artistToken))
      .send({ status: "published" });
    assert.equal(publish.status, 200);
  });

  after(() => ctx.cleanup());

  test("a funded buyer purchases: balance = deposit − price − 2.5% fee", async () => {
    const buyer = await signup(ctx.app, { name: "Buyer One" });

    const dep = await request(ctx.app)
      .post("/api/v1/wallet/deposit")
      .set(bearer(buyer.token))
      .send({ amount: 20 });
    assert.equal(dep.status, 200);
    assert.equal(dep.body.data.wallet.balance, 20);

    const buy = await request(ctx.app)
      .post("/api/v1/purchases")
      .set(bearer(buyer.token))
      .send({ contentId });
    assert.equal(buy.status, 201);
    // $20.00 − $10.00 − $0.25 fee = $9.75
    assert.equal(buy.body.data.balance, 9.75);

    const library = await request(ctx.app)
      .get("/api/v1/purchases")
      .set(bearer(buyer.token));
    assert.equal(library.status, 200);
    assert.equal(library.body.data.items.length, 1);
    assert.equal(library.body.data.items[0].contentId, contentId);

    // Owning it grants access.
    const access = await request(ctx.app)
      .get(`/api/v1/purchases/${contentId}/access`)
      .set(bearer(buyer.token));
    assert.equal(access.status, 200);
    assert.equal(access.body.data.access.contentId, contentId);
  });

  test("an unfunded buyer is refused with INSUFFICIENT_FUNDS", async () => {
    const broke = await signup(ctx.app, { name: "Broke Buyer" });
    const res = await request(ctx.app)
      .post("/api/v1/purchases")
      .set(bearer(broke.token))
      .send({ contentId });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INSUFFICIENT_FUNDS");
  });

  test("an artist cannot purchase their own release", async () => {
    const res = await request(ctx.app)
      .post("/api/v1/purchases")
      .set(bearer(artistToken))
      .send({ contentId });
    assert.equal(res.status, 400);
  });

  test("resale moves the pass and splits money correctly", async () => {
    // Seller buys the release ($9.75 left after a $20 deposit).
    const seller = await signup(ctx.app, { name: "Reseller" });
    await request(ctx.app)
      .post("/api/v1/wallet/deposit")
      .set(bearer(seller.token))
      .send({ amount: 20 });
    const bought = await request(ctx.app)
      .post("/api/v1/purchases")
      .set(bearer(seller.token))
      .send({ contentId });
    assert.equal(bought.status, 201);
    const purchaseId = bought.body.data.purchase.id;

    // List it for $12.00.
    const listing = await request(ctx.app)
      .post("/api/v1/resale")
      .set(bearer(seller.token))
      .send({ purchaseId, price: 12 });
    assert.equal(listing.status, 201);
    const listingId = listing.body.data.listing.id;

    // A second buyer purchases the listing.
    const buyer2 = await signup(ctx.app, { name: "Buyer Two" });
    await request(ctx.app)
      .post("/api/v1/wallet/deposit")
      .set(bearer(buyer2.token))
      .send({ amount: 20 });
    const resaleBuy = await request(ctx.app)
      .post(`/api/v1/resale/${listingId}/buy`)
      .set(bearer(buyer2.token));
    assert.equal(resaleBuy.status, 201);
    // Buyer two: $20.00 − $12.00 = $8.00
    assert.equal(resaleBuy.body.data.balance, 8);

    // Seller nets price − 5% commission = $12.00 − $0.60 = $11.40, on top of
    // the $9.75 they had left → $21.15.
    const sellerWallet = await request(ctx.app)
      .get("/api/v1/wallet")
      .set(bearer(seller.token));
    assert.equal(sellerWallet.body.data.wallet.balance, 21.15);

    // The listing is gone from the seller's active listings.
    const mine = await request(ctx.app)
      .get("/api/v1/resale/mine")
      .set(bearer(seller.token));
    const active = mine.body.data.listings.filter((l: { status: string }) => l.status === "active");
    assert.equal(active.length, 0);

    // Buyer two now owns it.
    const lib = await request(ctx.app)
      .get("/api/v1/purchases")
      .set(bearer(buyer2.token));
    assert.equal(lib.body.data.items.some((i: { contentId: string }) => i.contentId === contentId), true);
  });
});
