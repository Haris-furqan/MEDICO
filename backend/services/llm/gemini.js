// Gemini client (plain fetch, no SDK).
// Flow for every call: primary model (retry + exponential backoff) -> LLM_FALLBACK_MODEL (retry) -> caller's fallback.
import { createHash } from 'node:crypto';
import { parseValue } from '../engine/parse.js';
import { templateExplanation, DISCLAIMER } from '../engine/templateExplain.js';
import { violatesNoDiagnosis, asksForDiagnosis } from '../guards/noDiagnosis.js';
import { cacheGet, cacheSet } from './cache.js';
import {
  PROMPT_VERSION, EXPLAIN_SYSTEM, EXTRACT_SYSTEM, DX_HINT, chatSystem,
  EXPLAIN_SCHEMA, CHAT_SCHEMA, EXTRACT_SCHEMA,
} from './prompts.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 12000;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 8000;

const CLASSIFIED = ['normal', 'low', 'high', 'urgent', 'abnormal'];
const URGENT_WARNING = 'URGENT: please see a doctor today.';
const OFF_TOPIC_REPLY = 'I can only help with questions about the report that is currently open.';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- low level: one HTTP call, retry, fallback model ---------- */

async function callModel(model, body, apiKey) {
  const res = await fetch(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = new Error(`Gemini ${model} HTTP ${res.status}`);
    err.status = res.status;
    const ra = Number(res.headers.get('retry-after'));
    if (Number.isFinite(ra) && ra > 0) err.retryAfterMs = Math.min(ra * 1000, BACKOFF_MAX_MS);
    throw err;
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) {
    const err = new Error('Gemini returned no text (blocked or empty)');
    err.retryable = false;
    throw err;
  }
  return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim());
}

// Retry on: 429, 5xx, timeouts, network errors, bad JSON. Do NOT retry on other 4xx.
const isRetryable = (e) => e.retryable ?? (e.status == null || e.status === 429 || e.status >= 500);

async function withRetry(model, body, apiKey, maxRetries) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callModel(model, body, apiKey);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxRetries) break;
      const wait = err.retryAfterMs ?? Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS) + Math.random() * 250;
      console.warn(`[llm] ${model} attempt ${attempt + 1} failed (${err.status ?? err.name}); retrying in ${Math.round(wait)}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

export async function generateJson({ system, contents, schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const primary = process.env.LLM_MODEL;
  const fallback = process.env.LLM_FALLBACK_MODEL;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  if (!primary) throw new Error('LLM_MODEL is not set');

  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema: schema,
    temperature: 0.2,
    maxOutputTokens: 4096,
  };
  // Optional: set LLM_THINKING_BUDGET=0 to turn thinking off on 2.5 models (faster). Not all models accept it.
  if (process.env.LLM_THINKING_BUDGET != null && process.env.LLM_THINKING_BUDGET !== '') {
    generationConfig.thinkingConfig = { thinkingBudget: Number(process.env.LLM_THINKING_BUDGET) };
  }
  const body = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig };

  try {
    return { json: await withRetry(primary, body, apiKey, 2), model: primary };
  } catch (err) {
    if (!fallback || fallback === primary) throw err;
    console.warn(`[llm] primary ${primary} failed (${err.message}); switching to fallback ${fallback}`);
    return { json: await withRetry(fallback, body, apiKey, 1), model: fallback };
  }
}

/* ---------- what the LLM sees: classified results only, no name, no MRN, no raw files ---------- */

function toLlmPayload(c) {
  return {
    patient: { age: c.patient.age, sex: c.patient.sex },
    hasUrgent: c.hasUrgent,
    results: c.results.map((r) => ({
      test: r.analyte ?? r.rawName,
      value: r.value,
      unit: r.unit,
      status: r.status,
      direction: r.direction,
      urgent: r.urgent,
      normalRange: r.range ?? null,
      reason: r.reason ?? null,
    })),
  };
}

/* ---------- explain (POST /api/analyze) ---------- */

// Validates the LLM output and rebuilds the parts that code owns (analyte, status, warnings, disclaimer).
// Returns null if the output is unusable or fails the no-diagnosis guard.
function buildExplanation(json, classified, expected, anyBad) {
  if (!json || typeof json !== 'object') return null;
  const str = (v) => (typeof v === 'string' ? v.trim() : '');

  const summary = str(json.summary);
  if (!summary) return null;

  const llmTests = Array.isArray(json.perTest) ? json.perTest : [];
  const perTest = [];
  for (const r of expected) {
    const t = llmTests.find((x) => str(x?.analyte).toLowerCase() === r.analyte.toLowerCase());
    const whatItMeasures = str(t?.whatItMeasures);
    const whatItMeans = str(t?.whatItMeans);
    if (!whatItMeasures || !whatItMeans) return null;
    perTest.push({ analyte: r.analyte, status: r.status, whatItMeasures, whatItMeans });
  }

  let questions = (Array.isArray(json.doctorQuestions) ? json.doctorQuestions : []).map(str).filter(Boolean);
  if (anyBad && questions.length < 3) return null;
  if (classified.hasUrgent && !questions.some((q) => /today/i.test(q))) {
    questions.unshift('Do I need treatment or a visit today?');
  }
  questions = [...new Set(questions)].slice(0, 5);

  const texts = [summary, ...perTest.flatMap((t) => [t.whatItMeasures, t.whatItMeans]), ...questions];
  if (texts.some(violatesNoDiagnosis)) return null;

  return {
    summary,
    perTest,
    doctorQuestions: questions,
    warnings: classified.hasUrgent ? [URGENT_WARNING] : [],
    disclaimer: DISCLAIMER,
  };
}

export async function explain(classified) {
  const payload = toLlmPayload(classified);
  const key = createHash('sha256').update(PROMPT_VERSION + JSON.stringify(payload)).digest('hex');

  const hit = await cacheGet(key);
  if (hit) return { explanation: hit.explanation, status: 'ok', model: hit.model, cached: true };

  const expected = classified.results.filter((r) => CLASSIFIED.includes(r.status));
  const anyBad = expected.some((r) => r.status !== 'normal');
  const contents = [{ role: 'user', parts: [{ text: JSON.stringify(payload) }] }];

  // Up to 2 tries: the 2nd one is the "regenerate once" after the no-diagnosis guard (or bad shape).
  for (let attempt = 0; attempt < 2; attempt++) {
    let json, model;
    try {
      ({ json, model } = await generateJson({ system: EXPLAIN_SYSTEM, contents, schema: EXPLAIN_SCHEMA }));
    } catch (err) {
      console.error('[llm] explain failed after retries + fallback model:', err.message);
      break; // go to template
    }
    const explanation = buildExplanation(json, classified, expected, anyBad);
    if (!explanation) {
      console.warn(`[llm] explain output rejected (attempt ${attempt + 1})`);
      continue;
    }
    await cacheSet(key, { explanation, model });
    return { explanation, status: 'ok', model, cached: false };
  }

  return { explanation: templateExplanation(classified), status: 'fallback', model: 'template', cached: false };
}

/* ---------- chat (POST /api/chat) ---------- */

function citationsFor(c) {
  const s = new Set();
  for (const r of c.results) if (r.source) s.add(r.source);
  if (c.hasUrgent) s.add('3_dangerous_urgent_values.md');
  if (c.results.some((r) => r.status === 'needs_info' || r.status === 'cannot_classify')) s.add('1_lab_safety_rules.md');
  return [...s];
}

function fallbackChatReply(c) {
  const lines = c.results
    .filter((r) => CLASSIFIED.includes(r.status))
    .map((r) => `${r.analyte} ${r.value}${r.unit ? ' ' + r.unit : ''} is ${r.status}`);
  let text = "I can't write a detailed answer right now.";
  if (lines.length) text += ` The lab's classification: ${lines.join('; ')}.`;
  text += ' Only a licensed doctor can say what results mean or diagnose anything.';
  if (c.hasUrgent) text += ' Some results are urgent: please see a doctor today.';
  return text;
}

function toContents(history, message) {
  const turns = history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] }));
  while (turns.length && turns[0].role !== 'user') turns.shift(); // Gemini needs the first turn to be the user
  turns.push({ role: 'user', parts: [{ text: message }] });
  return turns;
}

export async function answerChat({ classified, message, history }) {
  const asksDx = asksForDiagnosis(message);
  const reason = asksDx ? 'no_diagnosis' : null;
  const citations = citationsFor(classified);
  const system = chatSystem(toLlmPayload(classified)) + (asksDx ? DX_HINT : '');
  const contents = toContents(history ?? [], message);

  for (let attempt = 0; attempt < 2; attempt++) {
    let out;
    try {
      ({ json: out } = await generateJson({ system, contents, schema: CHAT_SCHEMA }));
    } catch (err) {
      console.error('[llm] chat failed after retries + fallback model:', err.message);
      return { reply: fallbackChatReply(classified), refusalReason: reason, citations };
    }
    if (out?.offTopic === true) {
      return { reply: OFF_TOPIC_REPLY, refusalReason: 'off_topic', citations: ['1_lab_safety_rules.md'] };
    }
    let reply = typeof out?.reply === 'string' ? out.reply.trim() : '';
    if (!reply || violatesNoDiagnosis(reply)) {
      console.warn(`[llm] chat output rejected by no-diagnosis guard (attempt ${attempt + 1})`);
      continue; // regenerate once
    }
    if (classified.hasUrgent && !/doctor/i.test(reply)) reply += ' Some results are urgent: please see a doctor today.';
    return { reply, refusalReason: reason, citations };
  }
  return { reply: fallbackChatReply(classified), refusalReason: reason, citations };
}

/* ---------- extraction fallback (unseen report layouts) ---------- */

// Returns { patient, results } in the same shape as parseReport, or null. The SAME classifier runs after this.
export async function extractReport(rawText) {
  const body = rawText.split(/^###\s*APPENDIX/m)[0].slice(0, 30000);
  const { json } = await generateJson({
    system: EXTRACT_SYSTEM,
    contents: [{ role: 'user', parts: [{ text: body }] }],
    schema: EXTRACT_SCHEMA,
  });
  if (!Array.isArray(json?.results)) return null;

  // Anti-hallucination: keep a result only if its value is really in the text (commas ignored, so 120,000 matches 120000).
  const haystack = body.replace(/,/g, '').toLowerCase();
  const results = [];
  for (const r of json.results.slice(0, 100)) {
    const rawName = typeof r?.rawName === 'string' ? r.rawName.trim() : '';
    const val = r?.value == null ? '' : String(r.value).trim();
    if (!rawName || !val) continue;
    const v = parseValue(val);
    const printed = String(v.value ?? v.text).replace(/,/g, '').toLowerCase();
    if (!haystack.includes(printed)) continue;
    const unit = typeof r.unit === 'string' && r.unit.trim() ? r.unit.trim() : v.unit;
    results.push({ rawName, value: v.value, text: v.text, unit });
  }
  if (!results.length) return null;

  const age = Number.isInteger(json.age) && json.age >= 0 && json.age <= 120 ? json.age : null;
  const sex = json.sex === 'Male' || json.sex === 'Female' ? json.sex : null; // never guessed
  const s = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    patient: { name: s(json.name), age, sex, ageRaw: null, sexRaw: null, mrn: s(json.mrn) },
    results,
  };
}