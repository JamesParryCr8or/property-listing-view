import { neon } from "@neondatabase/serverless";

export type ApplicationDocument = {
  kind: string;
  name: string;
  size: number;
};

export function databaseConnectionString() {
  return process.env.DATABASE_URL
    ?? process.env.POSTGRES_URL
    ?? process.env.NEON_DATABASE_URL
    ?? process.env.DATABASE_URL_UNPOOLED;
}

export function database() {
  const connectionString = databaseConnectionString();
  if (!connectionString) throw new Error("Database connection is not configured");
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
  await sql`ALTER TABLE viewing_applications ADD COLUMN IF NOT EXISTS user_id text`;
  return sql;
}

export async function ensurePortalSchema() {
  const sql = await ensureApplicationSchema();
  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'buyer',
      phone text NOT NULL DEFAULT '',
      buying_position text NOT NULL DEFAULT '',
      deposit_status text NOT NULL DEFAULT '',
      mortgage_status text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      token_hash text UNIQUE NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS seller_properties (
      property_slug text PRIMARY KEY,
      owner_user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      title text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS viewing_messages (
      id text PRIMARY KEY,
      application_id text NOT NULL REFERENCES viewing_applications(id) ON DELETE CASCADE,
      sender_user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS property_offers (
      id text PRIMARY KEY,
      property_slug text NOT NULL,
      buyer_user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      amount integer NOT NULL,
      status text NOT NULL DEFAULT 'submitted',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS sessions_token_idx ON user_sessions(token_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS applications_user_idx ON viewing_applications(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS messages_application_idx ON viewing_messages(application_id)`;
  return sql;
}
