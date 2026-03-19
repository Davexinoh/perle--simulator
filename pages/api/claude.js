async function callGemini(apiKey, system, user) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
    if (code === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
    throw new Error("AI service error. Please try again.");
  }

  const data = await response.json();

  // Concatenate all parts in case model returns multiple
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("");
}

function extractJSON(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return clean.slice(start, end + 1);
}

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

  const enforcedUser = `${user}

CRITICAL: Respond with a single raw JSON object only. No markdown, no code fences, no explanation — just the JSON.`;

  try {
    const text = await callGemini(apiKey, system, enforcedUser);
    const jsonStr = extractJSON(text);

    if (!jsonStr) {
      return res.status(500).json({ error: "Could not parse AI response. Please try again." });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      try {
        parsed = JSON.parse(jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
      } catch {
        return res.status(500).json({ error: "Could not parse AI response. Please try again." });
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
