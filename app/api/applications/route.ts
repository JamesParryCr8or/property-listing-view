import { z } from "zod";
import { databaseConnectionString, ensureApplicationSchema } from "@/lib/database";

const documentSchema = z.object({
  kind: z.string().min(1).max(80),
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative().max(25_000_000),
});

const applicationSchema = z.object({
  propertySlug: z.string().min(1).max(120),
  viewingSlot: z.string().min(1).max(120),
  applicantName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(7).max(40),
  buyingPosition: z.string().min(1).max(80),
  depositStatus: z.string().min(1).max(80),
  mortgageStatus: z.string().min(1).max(80),
  documents: z.array(documentSchema).max(8),
  notes: z.string().max(1000).default(""),
});

export async function GET() {
  if (!databaseConnectionString()) {
    return Response.json({ connected: false, reason: "missing_connection_binding" }, { status: 503 });
  }

  try {
    await ensureApplicationSchema();
    return Response.json({ connected: true });
  } catch {
    return Response.json({ connected: false, reason: "connection_failed" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const result = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return Response.json({ error: "Please check the application details." }, { status: 400 });
  }

  try {
    const sql = await ensureApplicationSchema();
    const id = crypto.randomUUID();
    const reference = `LW-${id.slice(0, 8).toUpperCase()}`;
    const value = result.data;
    const documents = JSON.stringify(value.documents);
    const rows = await sql`
      INSERT INTO viewing_applications (
        id, application_reference, property_slug, viewing_slot, applicant_name,
        email, phone, buying_position, deposit_status, mortgage_status, documents, notes
      ) VALUES (
        ${id}, ${reference}, ${value.propertySlug}, ${value.viewingSlot}, ${value.applicantName},
        ${value.email}, ${value.phone}, ${value.buyingPosition}, ${value.depositStatus},
        ${value.mortgageStatus}, CAST(${documents} AS jsonb), ${value.notes}
      )
      RETURNING application_reference, status, created_at
    `;
    return Response.json({ application: rows[0] }, { status: 201 });
  } catch {
    return Response.json({ error: "The application could not be saved." }, { status: 503 });
  }
}
