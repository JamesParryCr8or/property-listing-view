import { neon } from "@neondatabase/serverless";

export type ApplicationDocument = {
  kind: string;
  name: string;
  size: number;
};

export function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

export async function ensureApplicationSchema() {
  const sql = database();
  await sql`
    CREATE TABLE IF NOT EXISTS viewing_applications (
      id text PRIMARY KEY,
      application_reference text UNIQUE NOT NULL,
      property_slug text NOT NULL,
      viewing_slot text NOT NULL,
      applicant_name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL,
      buying_position text NOT NULL,
      deposit_status text NOT NULL,
      mortgage_status text NOT NULL,
      documents jsonb NOT NULL DEFAULT '[]'::jsonb,
      notes text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'documents_received',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS viewing_applications_email_idx ON viewing_applications (email)`;
  return sql;
}
