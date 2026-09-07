export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "Google Maps is not configured." }, { status: 503 });
  }

  return Response.json(
    { apiKey },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
