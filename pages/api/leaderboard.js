const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LEADERBOARD_KEY = "perle:leaderboard";
const TOP_N = 20;

async function redis(commands) {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json();
}

async function redisCmd(...args) {
  const res = await fetch(`${UPSTASH_URL}/${args.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).json({ error: "Leaderboard not configured" });
  }

  // GET — fetch top N + optional rank for a handle
  if (req.method === "GET") {
    try {
      const { handle } = req.query;

      // Get top 20 with scores
      const topRes = await redisCmd("ZREVRANGE", LEADERBOARD_KEY, "0", String(TOP_N - 1), "WITHSCORES");
      const raw = topRes.result || [];

      const entries = [];
      for (let i = 0; i < raw.length; i += 2) {
        entries.push({ handle: raw[i], points: parseInt(raw[i + 1], 10) });
      }

      let userRank = null;
      let userPoints = null;
      if (handle) {
        const rankRes = await redisCmd("ZREVRANK", LEADERBOARD_KEY, handle);
        const scoreRes = await redisCmd("ZSCORE", LEADERBOARD_KEY, handle);
        if (rankRes.result !== null) {
          userRank = rankRes.result + 1;
          userPoints = parseInt(scoreRes.result || "0", 10);
        }
      }

      return res.status(200).json({ entries, userRank, userPoints });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — add points for a handle
  if (req.method === "POST") {
    try {
      const { handle, points } = req.body;

      if (!handle || typeof points !== "number") {
        return res.status(400).json({ error: "Missing handle or points" });
      }

      const cleanHandle = handle.replace(/^@/, "").slice(0, 32).trim();
      if (!cleanHandle) return res.status(400).json({ error: "Invalid handle" });

      // Increment score atomically
      const incrRes = await redisCmd("ZINCRBY", LEADERBOARD_KEY, String(points), cleanHandle);
      const newTotal = parseInt(incrRes.result || "0", 10);

      const rankRes = await redisCmd("ZREVRANK", LEADERBOARD_KEY, cleanHandle);
      const rank = rankRes.result !== null ? rankRes.result + 1 : null;

      return res.status(200).json({ handle: cleanHandle, points: newTotal, rank });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
