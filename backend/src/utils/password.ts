import crypto from "node:crypto";

/**
 * Password hashing with scrypt (memory-hard, in Node's std lib — no native
 * build, no third-party dependency). Format: `scrypt$N$r$p$salt$hash`, all
 * hex/decimal so it is self-describing and future-proof if params change.
 */

const N = 16_384; // CPU/memory cost
const r = 8;
const p = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = await scryptAsync(password, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  let derived: Buffer;
  try {
    derived = await scryptAsync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      maxmem: 256 * 1024 * 1024,
    });
  } catch {
    return false;
  }
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}
