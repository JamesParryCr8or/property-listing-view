import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ensurePortalSchema } from "@/lib/database";

const COOKIE_NAME = "listwise_session";
const SESSION_DAYS = 30;

function scrypt(value: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => nodeScrypt(value, salt, 64, (error, key) => error ? reject(error) : resolve(key as Buffer)));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const sql = await ensurePortalSchema();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await sql`INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (${crypto.randomUUID()}, ${userId}, ${tokenHash(token)}, ${expires.toISOString()})`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    const sql = await ensurePortalSchema();
    await sql`DELETE FROM user_sessions WHERE token_hash = ${tokenHash(token)}`;
  }
  store.delete(COOKIE_NAME);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const sql = await ensurePortalSchema();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.phone, u.buying_position, u.deposit_status, u.mortgage_status
    FROM user_sessions s JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > now()
    LIMIT 1
  `;
  return rows[0] ?? null;
}
