import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY = "perle:leaderboard";
const TOP_N = 20;

export default async function handler(req, res) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({ error: "Leaderboard not configured" });
  }

  // GET — fetch top N leaderboard + optional user rank
  if (req.method === "GET") {
    try {
      const { handle } = req.query;

      // Get top entries with scores, highest first
      const raw = await redis.zrange(KEY, 0, TOP_N - 1, {
        rev: true,
        withScores: true,
      });

      // raw is [member, score, member, score, ...]
      const entries = [];
      for (let i = 0; i < raw.length; i += 2) {
        entries.push({ handle: raw[i], points: parseInt(raw[i + 1], 10) });
      }

      let userRank = null;
      let userPoints = null;
      if (handle) {
        const clean = handle.replace(/^@/, "").trim();
        const rank = await redis.zrevrank(KEY, clean);
        if (rank !== null) {
          userRank = rank + 1;
          const score = await redis.zscore(KEY, clean);
          userPoints = parseInt(score || "0", 10);
        }
      }

      return res.status(200).json({ entries, userRank, userPoints });
    } catch (e) {
      console.error("Leaderboard GET error:", e);
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

      const clean = handle.replace(/^@/, "").slice(0, 32).trim();
      if (!clean) return res.status(400).json({ error: "Invalid handle" });

      const newTotal = await redis.zincrby(KEY, points, clean);
      const rank = await redis.zrevrank(KEY, clean);

      return res.status(200).json({
        handle: clean,
        points: parseInt(newTotal, 10),
        rank: rank !== null ? rank + 1 : null,
      });
    } catch (e) {
      console.error("Leaderboard POST error:", e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
      }
  
