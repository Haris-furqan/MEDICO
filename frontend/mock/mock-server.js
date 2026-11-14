// Zero-dependency mock API for the frontend.   node mock/mock-server.js   ->  http://localhost:4000/api
// It runs the REAL classifier on the sample reports, so behavior (incl. re-running with demographics
// and pasted reports) matches the real backend. Only the LLM parts are templated.
//
// Simulate problems from the frontend by sending headers:
//   x-mock-llm: down      -> explanationStatus "fallback"
//   x-mock-delay: 2000    -> response delay in ms (default 400)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReport } from './engine/parse.js';
import { classifyReport } from './engine/classify.js';
import { templateExplanation } from './engine/templateExplain.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const mocks = JSON.parse(fs.readFileSync(path.join(here, 'mocks.json'), 'utf8'));
const PORT = process.env.PORT || 4000;

const send = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-mock-llm, x-mock-delay',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
};
const err = (res, code, c, message) => send(res, code, { error: { code: c, message } });
const readBody = (req) => new Promise((resolve) => {
  let d = '';
  req.on('data', (c) => (d += c));
  req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve(null); } });
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function analyze(body, llmDown) {
  let parsed; let id = null;
  if (body.patientId) {
    const rep = mocks.reports[body.patientId];
    if (!rep) return { status: 404, error: ['PATIENT_NOT_FOUND', `No patient ${body.patientId}`] };
    id = body.patientId;
    parsed = { patient: { ...rep.patient }, results: rep.results };
  } else if (typeof body.reportText === 'string' && body.reportText.trim()) {
    parsed = parseReport(body.reportText);
  } else {
    return { status: 400, error: ['BAD_REQUEST', 'Provide patientId or reportText'] };
  }
  const d = body.demographics;
  if (d) {
    if (d.age != null) {
      if (!Number.isInteger(d.age) || d.age < 0 || d.age > 120) return { status: 400, error: ['BAD_REQUEST', 'age must be an integer 0-120'] };
      parsed.patient.age = d.age;
    }
    if (d.sex != null) {
      if (!['Male', 'Female'].includes(d.sex)) return { status: 400, error: ['BAD_REQUEST', 'sex must be "Male" or "Female"'] };
      parsed.patient.sex = d.sex;
    }
  }
  if (!parsed.results.length) return { status: 422, error: ['NO_RESULTS_FOUND', 'Could not read any test results from this report'] };

  const c = classifyReport(parsed);
  const exp = templateExplanation(c);
  const { name, age, sex, mrn } = c.patient;
  return {
    status: 200,
    body: {
      patient: { id, name, age, sex, mrn },
      results: c.results.map(({ neededMissing, ...r }) => ({ ...r, neededMissing: neededMissing ?? [] })),
      needsInfo: c.needsInfo,
      hasUrgent: c.hasUrgent,
      explanation: exp,
      explanationStatus: !exp ? 'skipped' : llmDown ? 'fallback' : 'ok',
      meta: { cached: false, model: llmDown ? null : 'gemini-2.5-flash', ms: 1840 },
    },
  };
}

// This is also a spec for the real backend's privacy guard (do it in code BEFORE calling the LLM).
function chat(body) {
  const rep = mocks.reports[body.patientId];
  if (!body.patientId || !rep) return { status: 404, error: ['PATIENT_NOT_FOUND', 'Unknown patientId'] };
  if (!body.message || !String(body.message).trim()) return { status: 400, error: ['BAD_REQUEST', 'message is required'] };
  const msg = String(body.message);
  const low = msg.toLowerCase();

  const others = Object.values(mocks.reports).map((r) => r.patient).filter((p) => p.id !== body.patientId);
  const namesOther = others.some((p) => {
    const parts = p.name.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    return low.includes(p.name.toLowerCase()) || parts.some((t) => new RegExp(`\\b${t}\\b`).test(low))
      || low.includes(p.mrn.toLowerCase()) || new RegExp(`\\b${p.id.toLowerCase()}\\b`).test(low);
  });
  if (namesOther || /\b(other|another|else'?s?|everyone'?s?|all|any|every)\s+(other\s+)?patients?\b/.test(low)) {
    return { status: 200, body: { reply: "I can only discuss the report that is currently open. I can't share another patient's results.",
      refused: true, refusalReason: 'other_patient', citations: ['1_lab_safety_rules.md'] } };
  }
  if (/\bdo i have\b|\bam i (diabetic|anemic|sick)\b|\bdiagnos/.test(low)) {
    return { status: 200, body: { reply: "I can't diagnose conditions. I can explain what your numbers measure, and a licensed doctor can tell you what they mean for you.",
      refused: false, refusalReason: 'no_diagnosis', citations: ['1_lab_safety_rules.md'] } };
  }
  const first = analyze({ patientId: body.patientId }, false).body;
  const flagged = first.results.filter((r) => r.status !== 'normal').map((r) => `${r.analyte ?? r.rawName} (${r.status.replace('_', ' ')})`);
  return { status: 200, body: {
    reply: flagged.length
      ? `Here is what stands out in your report: ${flagged.join(', ')}. Ask me what any of these measure. Only a doctor can say what they mean for you.`
      : 'All the results I could check are normal. Ask me what any of them measure.',
    refused: false, refusalReason: null, citations: ['1_lab_safety_rules.md'] } };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return send(res, 204, {});
  await sleep(Number(req.headers['x-mock-delay'] ?? 400));
  const llmDown = req.headers['x-mock-llm'] === 'down';

  if (req.method === 'GET' && url.pathname === '/api/patients') return send(res, 200, { patients: mocks.patients });
  if (req.method === 'POST' && (url.pathname === '/api/analyze' || url.pathname === '/api/chat')) {
    const body = await readBody(req);
    if (!body) return err(res, 400, 'BAD_REQUEST', 'Invalid JSON');
    const out = url.pathname === '/api/analyze' ? analyze(body, llmDown) : chat(body);
    return out.error ? err(res, out.status, ...out.error) : send(res, out.status, out.body);
  }
  return err(res, 404, 'NOT_FOUND', `${req.method} ${url.pathname}`);
}).listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}/api`));
