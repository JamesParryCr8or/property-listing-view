const narration = `Welcome to Oakfield House in Wilmslow, Cheshire. This beautifully considered four-bedroom family home offers two thousand, one hundred and eighty-four square feet of relaxed, modern living.

The open-plan kitchen is the heart of the property, with doors opening directly onto a south-west facing garden. The owners say this is where the home feels most special, particularly at sunset when the entire ground floor becomes part of the garden.

Renovated in 2021, Oakfield House includes three bathrooms, generous reception space, a garage and thoughtfully landscaped grounds. Wilmslow station is around a twelve-minute walk away, while The Carrs Park is even closer.

The guide price is seven hundred and twenty-five thousand pounds. To experience the home for yourself, choose a convenient appointment and book your viewing directly with the owners.`;

export async function GET() {
  const apiKey = process.env.OPEN_AI_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Narration is not configured." }, { status: 503 });
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      input: narration,
      instructions: "Speak as a natural British female estate agent in her thirties. Sound warm, polished and trustworthy, with a refined modern British accent. Use an unhurried conversational pace, subtle enthusiasm and clear property-detail emphasis. Avoid sounding theatrical, overly posh, salesy or synthetic.",
      response_format: "mp3",
    }),
  });

  if (!response.ok || !response.body) {
    return Response.json({ error: "The property narration could not be generated." }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
