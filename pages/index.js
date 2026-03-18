import Head from "next/head";
import { useState } from "react";

const DOMAINS = [
  { id: "healthcare", label: "Healthcare", symbol: "⚕", hint: "Medical diagnosis, clinical guidelines, patient care" },
  { id: "legal",      label: "Legal",      symbol: "⚖", hint: "Case law, contracts, regulatory compliance" },
  { id: "robotics",   label: "Robotics",   symbol: "⬡", hint: "Motion planning, sensor fusion, control systems" },
  { id: "finance",    label: "Finance",    symbol: "◆", hint: "Risk modeling, market analysis, financial reasoning" },
  { id: "stem",       label: "STEM",       symbol: "∑", hint: "Scientific reasoning, mathematics, engineering" },
  { id: "linguistics",label: "Linguistics",symbol: "✦", hint: "Language, translation, semantic analysis" },
];

const TIERS = {
  Expert:     { color: "#C9A96E" },
  Proficient: { color: "#8BB8E8" },
  Developing: { color: "#6A6258" },
};

async function callAPI(system, user) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "API error");
  }
  return res.json();
}

export default function Home() {
  const [phase, setPhase] = useState("welcome");
  const [domain, setDomain] = useState(null);
  const [task, setTask] = useState(null);
  const [choice, setChoice] = useState(null);
  const [justification, setJustification] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [hoveredDomain, setHoveredDomain] = useState(null);

  const totalPoints = sessions.reduce((s, r) => s + r.points, 0);
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length)
    : 0;

  async function startTask(d) {
    const target = d || domain;
    setDomain(target);
    setPhase("loading");
    setError("");
    setChoice(null);
    setJustification("");
    setResults(null);

    try {
      const parsed = await callAPI(
        `You generate realistic RLHF annotation tasks for Perle Labs, an enterprise AI training data platform backed by $17.5M (Framework Ventures). Tasks involve evaluating AI responses in specialized domains. Always return valid JSON only — no markdown, no preamble, no extra text.`,
        `Domain: ${target.label} (${target.hint})

Return this exact JSON structure:
{
  "prompt": "<2-sentence realistic question an AI assistant might receive in the ${target.label} domain>",
  "responseA": "<A subtly weaker AI response — plausible but has gaps in accuracy, missing nuance, or incomplete reasoning. 3-4 sentences.>",
  "responseB": "<A clearly stronger AI response — expert-level accuracy, thorough, well-structured. 3-4 sentences.>",
  "correctChoice": "B"
}`
      );

      // Randomize which slot holds the better response so it's not always B
      const flip = Math.random() > 0.5;
      setTask(
        flip
          ? { prompt: parsed.prompt, responseA: parsed.responseB, responseB: parsed.responseA, correctChoice: "A" }
          : { ...parsed }
      );
      setPhase("task");
    } catch (e) {
      setError(e.message || "Failed to load task. Please try again.");
      setPhase("welcome");
    }
  }

  async function submitAnnotation() {
    if (!choice || justification.trim().length < 10) return;
    setPhase("scoring");
    setError("");

    try {
      const parsed = await callAPI(
        `You are a senior QA evaluator at Perle Labs scoring annotation quality. Evaluate based on: correctness of choice, depth of reasoning, domain expertise shown, and clarity of justification. Always return valid JSON only — no markdown, no preamble.`,
        `Domain: ${domain.label}
Prompt: "${task.prompt}"
Response A: "${task.responseA}"
Response B: "${task.responseB}"
Correct answer: ${task.correctChoice}
Annotator chose: ${choice}
Justification: "${justification}"

Return this exact JSON structure:
{
  "score": <integer 0-100 reflecting annotation quality>,
  "correct": <true if they chose ${task.correctChoice}, else false>,
  "tier": "<Expert if score>=80, Proficient if score>=55, Developing if score<55>",
  "feedback": "<2-3 sentences of specific, substantive feedback — what was strong or what they missed>",
  "points": <integer 10-250 proportional to score>,
  "accuracyBonus": <true if they chose correctly, else false>
}`
      );

      setResults(parsed);
      setSessions((prev) => [
        ...prev,
        {
          domain: domain.label,
          score: parsed.score,
          points: parsed.points,
          correct: parsed.correct,
          tier: parsed.tier,
        },
      ]);
      setPhase("results");
    } catch (e) {
      setError(e.message || "Scoring failed. Please try again.");
      setPhase("task");
    }
  }

  const canSubmit = choice && justification.trim().length >= 10;
  const tierColor = results ? (TIERS[results.tier]?.color || "#6A6258") : "#6A6258";

  return (
    <>
      <Head>
        <title>Perle Labs — Annotation Simulator</title>
        <meta name="description" content="Experience the Perle Labs contributor flow. Evaluate AI responses, earn points, build your verified on-chain reputation on Solana." />
        <meta property="og:title" content="Perle Labs — Annotation Simulator" />
        <meta property="og:description" content="A live RLHF annotation demo built on the Perle Labs contributor model. Pick a domain, judge two AI responses, earn verified points." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        .pr-root { min-height: 100vh; background: #060609; color: #E8E4DC; font-family: 'Syne', sans-serif; position: relative; overflow-x: hidden; }
        .pr-ambient { position: fixed; inset: 0; background: radial-gradient(ellipse 60% 50% at 80% 10%, rgba(180,145,90,.08) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 10% 85%, rgba(80,120,200,.05) 0%, transparent 55%); pointer-events: none; z-index: 0; }
        .pr-grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(255,255,255,.013) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.013) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; z-index: 0; }
        .pr-topbar { position: sticky; top: 0; z-index: 10; background: rgba(6,6,9,.9); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.05); padding: 0 24px; height: 54px; display: flex; align-items: center; justify-content: space-between; }
        .pr-gem { width: 22px; height: 22px; background: linear-gradient(135deg, #C9A96E, #8BB8E8); clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); flex-shrink: 0; }
        .pr-logo-name { font-size: 15px; font-weight: 700; background: linear-gradient(120deg, #C9A96E 0%, #E8DFC8 50%, #8BB8E8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .pr-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(20,241,149,.06); border: 1px solid rgba(20,241,149,.15); border-radius: 20px; padding: 4px 11px; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #14F195; letter-spacing: .05em; white-space: nowrap; }
        .pr-blink { width: 5px; height: 5px; border-radius: 50%; background: #14F195; animation: blink 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }
        .pr-wrap { max-width: 680px; margin: 0 auto; padding: 56px 24px 100px; position: relative; z-index: 1; }
        .pr-mono { font-family: 'JetBrains Mono', monospace; }
        .pr-serif { font-family: 'Instrument Serif', serif; }
        .pr-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #3A3530; letter-spacing: .13em; margin-bottom: 13px; }
        .pr-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; }
        .pr-domain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .pr-domain { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; padding: 18px 14px; cursor: pointer; transition: all .15s ease; user-select: none; }
        .pr-domain:hover { border-color: rgba(201,169,110,.22); transform: translateY(-2px); background: rgba(201,169,110,.03); }
        .pr-domain.sel { border-color: rgba(201,169,110,.5); background: rgba(201,169,110,.05); }
        .pr-response { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07); border-radius: 13px; padding: 20px; cursor: pointer; transition: all .15s ease; }
        .pr-response:hover { border-color: rgba(139,184,232,.22); background: rgba(139,184,232,.03); }
        .pr-response.chosen { border-color: rgba(139,184,232,.55); background: rgba(139,184,232,.05); }
        .pr-btn { width: 100%; background: linear-gradient(135deg, #C9A96E 0%, #9A7840 100%); color: #060609; border: none; border-radius: 10px; padding: 15px 24px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: .025em; cursor: pointer; transition: all .15s ease; }
        .pr-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(201,169,110,.28); }
        .pr-btn:disabled { opacity: .3; cursor: not-allowed; }
        .pr-ghost { background: transparent; color: #5A5248; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 12px 20px; font-family: 'Syne', sans-serif; font-size: 13px; cursor: pointer; transition: all .15s ease; white-space: nowrap; }
        .pr-ghost:hover { border-color: rgba(255,255,255,.18); color: #E8E4DC; }
        .pr-textarea { width: 100%; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; color: #E8E4DC; font-family: 'Syne', sans-serif; font-size: 13px; line-height: 1.72; padding: 14px 16px; resize: none; outline: none; transition: border-color .15s; }
        .pr-textarea:focus { border-color: rgba(201,169,110,.38); }
        .pr-textarea::placeholder { color: #252220; }
        .pr-error { background: rgba(200,60,60,.07); border: 1px solid rgba(200,60,60,.22); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #C07070; margin-bottom: 16px; line-height: 1.6; }
        .pr-pulse { animation: pulse 1.8s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
        .pr-bar { height: 3px; background: rgba(255,255,255,.06); border-radius: 2px; overflow: hidden; margin-top: 9px; }
        .pr-bar-fill { height: 100%; border-radius: 2px; transition: width .7s ease; }
        .pr-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 13px; border-radius: 8px; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.04); }
        @keyframes slide { from { opacity: 0; transform: translateY(13px); } to { opacity: 1; transform: translateY(0); } }
        .pr-in { animation: slide .32s ease forwards; }

        @media (max-width: 480px) {
          .pr-domain-grid { grid-template-columns: repeat(2, 1fr); }
          .pr-response-grid { grid-template-columns: 1fr !important; }
          .pr-score-grid { grid-template-columns: 1fr 1fr !important; }
          h1.pr-serif { font-size: 40px !important; }
          h2.pr-serif { font-size: 36px !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <div className="pr-root">
        <div className="pr-ambient" />
        <div className="pr-grid" />

        {/* ── Topbar ── */}
        <div className="pr-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div className="pr-gem" />
            <span className="pr-logo-name">Perle Labs</span>
            <span className="hide-mobile" style={{ color: "#252220", margin: "0 6px", fontSize: 11 }}>·</span>
            <span className="pr-mono hide-mobile" style={{ fontSize: 9, color: "#2E2A26", letterSpacing: ".1em" }}>
              ANNOTATION SIMULATOR
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {sessions.length > 0 && (
              <span className="pr-mono" style={{ fontSize: 11, color: "#C9A96E" }}>
                {totalPoints.toLocaleString()} pts
              </span>
            )}
            <div className="pr-badge">
              <div className="pr-blink" />
              SEASON 1 LIVE
            </div>
          </div>
        </div>

        <div className="pr-wrap">

          {/* ══ WELCOME ══ */}
          {phase === "welcome" && (
            <div className="pr-in">
              <div style={{ marginBottom: 52 }}>
                <div className="pr-mono" style={{ fontSize: 9, color: "#3A3530", letterSpacing: ".15em", marginBottom: 20 }}>
                  EXPERT-IN-THE-LOOP · SOLANA · VERIFIED EXPERTISE
                </div>
                <h1 className="pr-serif" style={{ fontSize: 56, lineHeight: 1.06, letterSpacing: "-.01em", marginBottom: 20 }}>
                  Your expertise<br />
                  <span style={{ background: "linear-gradient(130deg, #C9A96E 0%, #E8DFC8 40%, #8BB8E8 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    trains better AI.
                  </span>
                </h1>
                <p style={{ color: "#5A5248", fontSize: 15, lineHeight: 1.82, maxWidth: 430 }}>
                  Experience the Perle Labs contributor flow. Pick a domain, evaluate two AI responses, earn points that build your verified on-chain reputation.
                </p>
              </div>

              {error && <div className="pr-error">{error}</div>}

              <div style={{ marginBottom: 28 }}>
                <div className="pr-label">01 — SELECT YOUR DOMAIN</div>
                <div className="pr-domain-grid">
                  {DOMAINS.map((d) => (
                    <div
                      key={d.id}
                      className={`pr-domain${domain?.id === d.id ? " sel" : ""}`}
                      onClick={() => setDomain(d)}
                      onMouseEnter={() => setHoveredDomain(d.id)}
                      onMouseLeave={() => setHoveredDomain(null)}
                    >
                      <div style={{ fontSize: 21, marginBottom: 9 }}>{d.symbol}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: domain?.id === d.id ? "#C9A96E" : "#C0B8A8" }}>
                        {d.label}
                      </div>
                      {(hoveredDomain === d.id || domain?.id === d.id) && (
                        <div className="pr-mono" style={{ fontSize: 9, color: "#4A4540", marginTop: 8, lineHeight: 1.55 }}>
                          {d.hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="pr-btn"
                disabled={!domain}
                onClick={() => startTask(domain)}
                style={{ marginBottom: 28 }}
              >
                Start Annotating →
              </button>

              {/* Stats strip */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                {[
                  { v: "$17.5M", l: "Total raised" },
                  { v: "15K+",   l: "Expert contributors" },
                  { v: "70",     l: "Countries" },
                  { v: "Solana", l: "On-chain rewards" },
                ].map((s) => (
                  <div key={s.v} className="pr-card" style={{ padding: "11px 16px" }}>
                    <div className="pr-mono" style={{ fontSize: 13, color: "#C9A96E", fontWeight: 500 }}>{s.v}</div>
                    <div className="pr-mono" style={{ fontSize: 9, color: "#3A3530", marginTop: 3, letterSpacing: ".06em" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="pr-mono" style={{ fontSize: 9, color: "#252220", lineHeight: 1.9 }}>
                Founded by alumni of Scale AI · Meta · Amazon · MIT<br />
                Backed by Framework Ventures · $17.5M raised
              </div>
            </div>
          )}

          {/* ══ LOADING ══ */}
          {phase === "loading" && (
            <div style={{ textAlign: "center", padding: "120px 0" }}>
              <div className="pr-gem pr-pulse" style={{ margin: "0 auto 24px", width: 36, height: 36 }} />
              <div className="pr-serif pr-pulse" style={{ fontSize: 34, marginBottom: 14 }}>
                Fetching {domain?.label} task...
              </div>
              <div className="pr-mono" style={{ fontSize: 10, color: "#3A3530" }}>
                Perle oracle · calibrating domain context
              </div>
            </div>
          )}

          {/* ══ TASK ══ */}
          {phase === "task" && task && (
            <div className="pr-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
                <div>
                  <div className="pr-label">{domain?.symbol} {domain?.label?.toUpperCase()} · RLHF ANNOTATION</div>
                  <div className="pr-badge"><div className="pr-blink" />on-chain · Solana</div>
                </div>
                <button className="pr-ghost" onClick={() => { setPhase("welcome"); setTask(null); }}>← Back</button>
              </div>

              {/* Prompt */}
              <div className="pr-card" style={{ padding: "20px 22px", marginBottom: 22 }}>
                <div className="pr-label">01 — USER PROMPT</div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "#D8D0C4" }}>{task.prompt}</p>
              </div>

              {/* Responses */}
              <div className="pr-label">02 — SELECT THE BETTER RESPONSE</div>
              <div className="pr-response-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                {[["A", task.responseA], ["B", task.responseB]].map(([label, text]) => (
                  <div
                    key={label}
                    className={`pr-response${choice === label ? " chosen" : ""}`}
                    onClick={() => setChoice(label)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span className="pr-mono" style={{ fontSize: 9, color: "#3A3530", letterSpacing: ".1em" }}>
                        RESPONSE {label}
                      </span>
                      {choice === label && (
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#8BB8E8" }} />
                      )}
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.76, color: "#9A9288" }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* Justification */}
              <div style={{ marginBottom: 22 }}>
                <div className="pr-label">03 — ANNOTATION JUSTIFICATION</div>
                <textarea
                  className="pr-textarea"
                  rows={4}
                  placeholder={`Explain why ${choice ? "Response " + choice : "your chosen response"} is stronger. Be specific about accuracy, depth, and domain correctness — quality reasoning earns more points.`}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <div className="pr-mono" style={{ fontSize: 9, color: "#252220", marginTop: 6 }}>
                  {justification.trim().length} chars · quality reasoning unlocks higher-value tasks
                </div>
              </div>

              {error && <div className="pr-error">{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="pr-btn" disabled={!canSubmit} onClick={submitAnnotation}>
                  Submit Annotation →
                </button>
                <button className="pr-ghost" onClick={() => startTask(domain)}>
                  New Task
                </button>
              </div>
            </div>
          )}

          {/* ══ SCORING ══ */}
          {phase === "scoring" && (
            <div style={{ textAlign: "center", padding: "120px 0" }}>
              <div className="pr-gem pr-pulse" style={{ margin: "0 auto 24px", width: 36, height: 36 }} />
              <div className="pr-serif pr-pulse" style={{ fontSize: 34, marginBottom: 14 }}>
                Evaluating quality...
              </div>
              <div className="pr-mono" style={{ fontSize: 10, color: "#3A3530" }}>
                Perle QA engine · consensus validation · computing points
              </div>
            </div>
          )}

          {/* ══ RESULTS ══ */}
          {phase === "results" && results && (
            <div className="pr-in">
              <div style={{ marginBottom: 34 }}>
                <div className="pr-label">ANNOTATION SCORED · {domain?.symbol} {domain?.label?.toUpperCase()}</div>
                <h2 className="pr-serif" style={{ fontSize: 48, lineHeight: 1.06, letterSpacing: "-.01em" }}>
                  {results.correct
                    ? <>
                        <span style={{ background: "linear-gradient(120deg, #C9A96E, #E8DFC8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Correct.</span>
                        {" "}Solid work.
                      </>
                    : <>Wrong pick. <span style={{ color: "#3A3530" }}>Study the gap.</span></>
                  }
                </h2>
              </div>

              {/* Score cards */}
              <div className="pr-score-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
                <div className="pr-card" style={{ padding: "22px 16px", textAlign: "center" }}>
                  <div className="pr-mono" style={{ fontSize: 40, color: tierColor, fontWeight: 500, lineHeight: 1 }}>
                    {results.score}
                  </div>
                  <div className="pr-mono" style={{ fontSize: 9, color: "#3A3530", marginTop: 8, letterSpacing: ".1em" }}>
                    QUALITY SCORE
                  </div>
                  <div className="pr-bar">
                    <div className="pr-bar-fill" style={{ width: `${results.score}%`, background: tierColor }} />
                  </div>
                </div>
                <div className="pr-card" style={{ padding: "22px 16px", textAlign: "center" }}>
                  <div className="pr-serif" style={{ fontSize: 28, color: tierColor, lineHeight: 1 }}>{results.tier}</div>
                  <div className="pr-mono" style={{ fontSize: 9, color: "#3A3530", marginTop: 8, letterSpacing: ".1em" }}>
                    TIER LEVEL
                  </div>
                  <div className="pr-mono" style={{ fontSize: 9, color: "#252220", marginTop: 6 }}>
                    {results.tier === "Expert" ? "≥80" : results.tier === "Proficient" ? "≥55" : "<55"} threshold
                  </div>
                </div>
                <div className="pr-card" style={{ padding: "22px 16px", textAlign: "center" }}>
                  <div className="pr-mono" style={{ fontSize: 36, color: "#14F195", fontWeight: 500, lineHeight: 1 }}>
                    +{results.points}
                  </div>
                  <div className="pr-mono" style={{ fontSize: 9, color: "#3A3530", marginTop: 8, letterSpacing: ".1em" }}>
                    POINTS EARNED
                  </div>
                  {results.accuracyBonus && (
                    <div className="pr-mono" style={{ fontSize: 9, color: "#14F195", marginTop: 6 }}>
                      +accuracy bonus
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback */}
              <div className="pr-card" style={{ padding: "20px 22px", marginBottom: 18 }}>
                <div className="pr-label">EXPERT FEEDBACK</div>
                <p style={{ fontSize: 14, lineHeight: 1.82, color: "#9A9288" }}>{results.feedback}</p>
              </div>

              {/* On-chain explanation */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "14px 18px", background: "rgba(20,241,149,.03)", border: "1px solid rgba(20,241,149,.08)", borderRadius: 12, marginBottom: 26 }}>
                <div className="pr-badge" style={{ flexShrink: 0, marginTop: 1 }}>
                  <div className="pr-blink" />simulated
                </div>
                <p style={{ fontSize: 12, color: "#4A4540", lineHeight: 1.75 }}>
                  On Perle Labs, this contribution is logged immutably on{" "}
                  <strong style={{ color: "#6A6258" }}>Solana</strong> with your contributor wallet.
                  Points build your verified reputation — Expert-tier work unlocks higher-value tasks from frontier AI labs.
                  Start for real at{" "}
                  <a href="https://app.perle.xyz" target="_blank" rel="noopener noreferrer" style={{ color: "#8BB8E8", textDecoration: "none" }}>
                    app.perle.xyz
                  </a>
                </p>
              </div>

              {/* Session history */}
              {sessions.length > 0 && (
                <div style={{ marginBottom: 26 }}>
                  <div className="pr-label">SESSION HISTORY</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sessions.map((s, i) => (
                      <div key={i} className="pr-row">
                        <span style={{ fontSize: 13, color: "#6A6258" }}>{s.domain}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                          <span className="pr-mono" style={{ fontSize: 11, color: TIERS[s.tier]?.color || "#6A6258" }}>
                            {s.score}/100
                          </span>
                          <span className="pr-mono" style={{ fontSize: 11, color: "#14F195" }}>
                            +{s.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                    <span className="pr-mono" style={{ fontSize: 9, color: "#3A3530" }}>AVG SCORE: {avgScore}/100</span>
                    <span className="pr-mono" style={{ fontSize: 12, color: "#C9A96E" }}>
                      {totalPoints.toLocaleString()} total pts
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="pr-btn"
                  onClick={() => { setPhase("welcome"); setTask(null); setResults(null); }}
                >
                  Annotate Again →
                </button>
                <button className="pr-ghost" onClick={() => startTask(domain)}>
                  Same Domain
                </button>
              </div>

              <div className="pr-mono" style={{ marginTop: 30, textAlign: "center", fontSize: 9, color: "#1A1816", lineHeight: 2.2 }}>
                perle.xyz · Season 1 Live · Built for #PerleAI #ToPerle<br />
                participating in @PerleLabs community campaign
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
