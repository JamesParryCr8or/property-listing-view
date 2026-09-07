import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { ensurePortalSchema } from "@/lib/database";
const schema=z.object({applicationId:z.string().uuid(),body:z.string().trim().min(1).max(1000)});
export async function POST(request:Request){
  const user=await currentUser(); if(!user)return Response.json({error:"Sign in required."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return Response.json({error:"Write a message first."},{status:400});
  const sql=await ensurePortalSchema(); const uid=String(user.id); const aid=parsed.data.applicationId;
  const allowed=await sql`SELECT a.id FROM viewing_applications a LEFT JOIN seller_properties p ON p.property_slug=a.property_slug WHERE a.id=${aid} AND (a.user_id=${uid} OR p.owner_user_id=${uid}) LIMIT 1`;
  if(!allowed.length)return Response.json({error:"Conversation unavailable."},{status:403});
  const rows=await sql`INSERT INTO viewing_messages(id,application_id,sender_user_id,body) VALUES(${crypto.randomUUID()},${aid},${uid},${parsed.data.body}) RETURNING id,application_id,body,created_at`;
  return Response.json({message:rows[0]},{status:201});
}
