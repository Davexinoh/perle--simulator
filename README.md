# Perle Labs — Annotation Simulator

An interactive, AI-powered demo of the Perle Labs contributor experience. Built to show exactly what Perle pays thousands of domain experts to do on-chain — evaluating AI responses, providing justifications, and earning rewards based on annotation quality.

This is not a landing page. It is a working simulation of the RLHF pipeline that powers enterprise AI training at scale.

---

## What is RLHF?

Reinforcement Learning from Human Feedback (RLHF) is the process by which AI models learn which responses are better. A human expert is shown two AI responses to the same prompt and asked to pick the stronger one — and more importantly, to explain *why*. That reasoning is what makes the feedback valuable. It teaches the model not just what was preferred, but the domain logic behind the preference.

This is the core work that Perle Labs coordinates globally, across 70 countries, with a vetted network of 15,000+ domain specialists in Healthcare, Legal, Robotics, Finance, STEM, and Linguistics. Every contribution is logged on Solana, every reward distributed automatically based on quality.

---

## What this app does

The simulator puts you inside that contributor flow from start to finish.

You select a domain that matches your expertise. The app generates a realistic prompt — the kind an AI assistant might actually receive in that field — along with two AI-generated responses of meaningfully different quality. You read both, decide which is stronger, and write a justification explaining your reasoning. The app then evaluates your annotation: how correct your choice was, how deep your reasoning went, how well you demonstrated domain knowledge.

Your result comes back as a quality score from 0 to 100, a tier classification (Expert, Proficient, or Developing), and a points total that reflects the real reward logic Perle uses on-chain. You can run multiple sessions across different domains and track your average score and cumulative points over time.

---

## Features

**Domain-specific task generation** — Tasks are generated live for each of Perle's six core verticals. A Healthcare task looks nothing like a Robotics task. The prompts and responses are calibrated to the actual complexity of each field.

**Blind response comparison** — The simulator randomizes which response appears as A or B on every task, so you can't pattern-match. You have to actually read and reason.

**AI-powered quality scoring** — Your annotation is evaluated across four dimensions: correctness of choice, depth of reasoning, domain expertise demonstrated, and clarity of justification. The feedback is specific, not generic.

**Tier progression** — Expert (≥80), Proficient (≥55), Developing (<55). The tier system mirrors how Perle gates access to higher-value enterprise tasks — consistent accuracy unlocks more specialized work.

**Session history** — Every annotation you complete is tracked within the session, showing your score, tier, and points per domain alongside your running average and total.

**Simulated on-chain context** — After each result, the app surfaces exactly what would happen in the live Perle platform: your contribution logged immutably on Solana, points distributed based on quality, reputation building toward higher-tier task access.

---

## Tech stack

- **Framework:** Next.js 14
- **AI:** Gemini 2.0 Flash via Google AI Studio API
- **Deployment:** Vercel
- **Fonts:** Syne, Instrument Serif, JetBrains Mono

The AI API key is handled entirely server-side via a Next.js API route. It never touches the client.

---

## Environment variables

```
GEMINI_API_KEY=your_key_here
```

Get a free key at aistudio.google.com.

---

Built for the @PerleLabs community campaign. #PerleAI #ToPerle
