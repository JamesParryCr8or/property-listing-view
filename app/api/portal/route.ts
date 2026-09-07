import { currentUser } from "@/lib/auth";
import { ensurePortalSchema } from "@/lib/database";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error:"Sign in required." }, { status:401 });
  const sql = await ensurePortalSchema();
  const id = String(user.id);
  const [buyerApplications,sellerRequests,messages,offers,properties] = await Promise.all([
    sql`SELECT id,application_reference,property_slug,viewing_slot,status,created_at FROM viewing_applications WHERE user_id=${id} OR (user_id IS NULL AND email=${String(user.email)}) ORDER BY created_at DESC`,
    sql`SELECT a.id,a.application_reference,a.property_slug,a.viewing_slot,a.applicant_name,a.buying_position,a.status,a.created_at FROM viewing_applications a JOIN seller_properties p ON p.property_slug=a.property_slug WHERE p.owner_user_id=${id} ORDER BY a.viewing_slot`,
    sql`SELECT m.id,m.application_id,m.body,m.created_at,m.sender_user_id,u.name AS sender_name FROM viewing_messages m JOIN app_users u ON u.id=m.sender_user_id JOIN viewing_applications a ON a.id=m.application_id LEFT JOIN seller_properties p ON p.property_slug=a.property_slug WHERE a.user_id=${id} OR p.owner_user_id=${id} ORDER BY m.created_at`,
    sql`SELECT o.id,o.property_slug,o.amount,o.status,o.created_at,o.buyer_user_id,u.name AS buyer_name FROM property_offers o JOIN app_users u ON u.id=o.buyer_user_id LEFT JOIN seller_properties p ON p.property_slug=o.property_slug WHERE o.buyer_user_id=${id} OR p.owner_user_id=${id} ORDER BY o.created_at DESC`,
    sql`SELECT property_slug,title FROM seller_properties WHERE owner_user_id=${id}`,
  ]);
  return Response.json({ user,buyerApplications,sellerRequests,messages,offers,properties });
}
