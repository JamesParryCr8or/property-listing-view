import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { ensurePortalSchema } from "@/lib/database";
const schema=z.object({propertySlug:z.string().min(1).max(120),amount:z.number().int().min(50000).max(100000000)});
export async function POST(request:Request){const user=await currentUser();if(!user)return Response.json({error:"Sign in required."},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Enter a valid offer."},{status:400});const sql=await ensurePortalSchema();const rows=await sql`INSERT INTO property_offers(id,property_slug,buyer_user_id,amount) VALUES(${crypto.randomUUID()},${parsed.data.propertySlug},${String(user.id)},${parsed.data.amount}) RETURNING id,property_slug,amount,status,created_at`;return Response.json({offer:rows[0]},{status:201});}
