// Regenerates frontend/mock/mocks.json AND refreshes frontend/mock/engine/ (the copy of the backend engine that
// makes the mock server standalone). Run from backend/ after changing src/engine/:  node scripts/build-mocks.mjs
// Needs the organizer folder at <repo root>/lab_reports (or set LAB_DIR).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReport } from '../src/engine/parse.js';
import { classifyReport } from '../src/engine/classify.js';
import { templateExplanation } from '../src/engine/templateExplain.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const MOCK = path.resolve(here, '../../frontend/mock');
// keep the standalone copy of the engine in sync with the backend
fs.mkdirSync(path.join(MOCK, 'engine'), { recursive: true });
for (const f of ['data.js', 'parse.js', 'classify.js', 'templateExplain.js'])
  fs.copyFileSync(path.join(here, '../src/engine', f), path.join(MOCK, 'engine', f));
const DIR = process.env.LAB_DIR || path.resolve(here, '../../lab_reports');
const patients = [];
const analyze = {};
const reports = {};

for (const f of fs.readdirSync(DIR).filter((n) => n.startsWith('report_')).sort()) {
  const id = f.match(/report_(P\d+)/)[1];
  const parsed = parseReport(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const c = classifyReport(parsed);
  const patient = { id, name: c.patient.name, age: c.patient.age, sex: c.patient.sex, mrn: c.patient.mrn };
  reports[id] = { patient, results: parsed.results }; // raw results, so the mock server can re-run with demographics
  patients.push({ ...patient, testCount: c.results.length, hasUrgent: c.hasUrgent, needsInfo: c.needsInfo });
  const exp = templateExplanation(c);
  analyze[id] = {
    patient,
    results: c.results.map(({ neededMissing, ...r }) => ({ ...r, neededMissing: neededMissing ?? [] })),
    needsInfo: c.needsInfo,
    hasUrgent: c.hasUrgent,
    explanation: exp,
    explanationStatus: exp ? 'ok' : 'skipped',
    meta: { cached: false, model: 'gemini-2.5-flash', ms: 1840 },
  };
}

const chat = [
  {
    request: { patientId: 'P004', message: 'What does my hemoglobin of 6.5 mean?' },
    response: {
      reply: "Hemoglobin is the protein in red blood cells that carries oxygen. Your value of 6.5 g/dL is below the lab's critical limit of 7.0, so please see a doctor today. I can't say why it is low; only a doctor can diagnose that.",
      refused: false, refusalReason: null, citations: ['3_dangerous_urgent_values.md', '4_ranges_hematology.md'],
    },
  },
  {
    request: { patientId: 'P004', message: "What were Ethan Hunt's sugar results?" },
    response: {
      reply: "I can only discuss the report that is currently open. I can't share another patient's results.",
      refused: true, refusalReason: 'other_patient', citations: ['1_lab_safety_rules.md'],
    },
  },
  {
    request: { patientId: 'P004', message: 'Do I have anemia?' },
    response: {
      reply: "I can't diagnose conditions. Your hemoglobin is below the lab's critical limit, which is why a doctor should look at it today. Only a licensed doctor can say what is causing it.",
      refused: false, refusalReason: 'no_diagnosis', citations: ['1_lab_safety_rules.md', '3_dangerous_urgent_values.md'],
    },
  },
];

fs.writeFileSync(path.join(MOCK, 'mocks.json'), JSON.stringify({ patients, analyze, chat, reports }, null, 2));
console.log(`wrote frontend/mock/mocks.json (${patients.length} patients)`);
