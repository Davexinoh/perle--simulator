export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, user } = req.body;

  if (!system || !user) {
    return res.status(400).json({ error: "Missing system or user prompt" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const code = errData?.error?.code;
      if (code === 429) {
        return res.status(429).json({ error: "Rate limit reached. Please wait a moment and try again." });
      }
      return res.status(response.status).json({ error: "AI service error. Please try again." });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Aggressively extract JSON — handles markdown fences, leading/trailing text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Could not extract JSON from model response." });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(500).json({ error: "Failed to parse model response. Please try again." });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
                                 }
