import { z } from "zod";
import { createSession, currentUser, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { ensurePortalSchema } from "@/lib/database";

const credentials = z.object({ action:z.enum(["register","login"]), email:z.string().email().max(200), password:z.string().min(8).max(100), name:z.string().min(2).max(100).optional(), role:z.enum(["buyer","seller","both"]).optional() });
const profile = z.object({ name:z.string().min(2).max(100), phone:z.string().max(40), buyingPosition:z.string().max(80), depositStatus:z.string().max(80), mortgageStatus:z.string().max(80) });

export async function GET() {
  await ensurePortalSchema();
  const user = await currentUser();
  return Response.json({ user });
}

export async function POST(request:Request) {
  const parsed = credentials.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error:"Use a valid email and a password of at least 8 characters." }, { status:400 });
  const value = parsed.data;
  const email = value.email.trim().toLowerCase();
  const sql = await ensurePortalSchema();
  if (value.action === "register") {
    if (!value.name) return Response.json({ error:"Please add your name." }, { status:400 });
    const existing = await sql`SELECT id FROM app_users WHERE email = ${email} LIMIT 1`;
    if (existing.length) return Response.json({ error:"An account already exists for that email." }, { status:409 });
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(value.password);
    await sql`INSERT INTO app_users (id,name,email,password_hash,role) VALUES (${id},${value.name},${email},${passwordHash},${value.role ?? "buyer"})`;
    if (value.role === "seller" || value.role === "both") await sql`INSERT INTO seller_properties (property_slug,owner_user_id,title) VALUES ('oakfield-house-wilmslow',${id},'Oakfield House') ON CONFLICT DO NOTHING`;
    await createSession(id);
    return Response.json({ ok:true }, { status:201 });
  }
  const rows = await sql`SELECT id,password_hash FROM app_users WHERE email = ${email} LIMIT 1`;
  if (!rows[0] || !await verifyPassword(value.password, String(rows[0].password_hash))) return Response.json({ error:"Email or password is incorrect." }, { status:401 });
  await createSession(String(rows[0].id));
  return Response.json({ ok:true });
}

export async function PATCH(request:Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error:"Sign in required." }, { status:401 });
  const parsed = profile.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error:"Please check your profile." }, { status:400 });
  const v = parsed.data;
  const sql = await ensurePortalSchema();
  await sql`UPDATE app_users SET name=${v.name},phone=${v.phone},buying_position=${v.buyingPosition},deposit_status=${v.depositStatus},mortgage_status=${v.mortgageStatus},updated_at=now() WHERE id=${String(user.id)}`;
  return Response.json({ ok:true });
}

export async function DELETE() {
  await destroySession();
  return Response.json({ ok:true });
}
