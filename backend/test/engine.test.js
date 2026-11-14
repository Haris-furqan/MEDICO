import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseReport } from '../src/engine/parse.js';
import { classifyReport } from '../src/engine/classify.js';

// Defaults to ../lab_reports relative to backend/ (the organizer folder at the repo root). Override with LAB_DIR.
const DIR = process.env.LAB_DIR || path.resolve('../lab_reports');

const run = (prefix) => {
  const f = fs.readdirSync(DIR).find((n) => n.startsWith(prefix));
  return classifyReport(parseReport(fs.readFileSync(path.join(DIR, f), 'utf8')));
};
const status = (r) => r.results.map((x) => `${x.analyte ?? x.rawName}:${x.status}`);

const EXPECTED = {
  report_P001: ['Hemoglobin:normal', 'White Blood Cell Count:normal'],
  report_P002: ['ALT:normal'],                       // 45 on the female limit; Bob is recorded Female
  report_P003: ['Fasting Blood Sugar:needs_info'],   // age/sex corrupted
  report_P004: ['Hemoglobin:urgent', 'Platelet Count:low'],
  report_P005: ['Fasting Blood Sugar:high'],         // 6.0 mmol/L = 108.1 mg/dL
  report_P006: ['Serum Ferritin:cannot_classify'],
  report_P007: ['TSH:normal'],
  report_P008: ['Urine pH:normal', 'Urine Protein:normal'],
  report_P009: ['ALT:high', 'AST:high'],
  report_P010: ['Cholesterol:normal'],               // 200 exactly on the limit
  report_P011: ['White Blood Cell Count:high', 'Platelet Count:low'],
  report_P012: ['AST:needs_info'],                   // sex missing, AST ranges differ by sex
  report_P013: ['Fasting Blood Sugar:urgent'],
  report_P014: ['Fasting Blood Sugar:normal', 'AST:normal'],
};

for (const [prefix, expected] of Object.entries(EXPECTED)) {
  test(prefix, () => assert.deepEqual(status(run(prefix)), expected));
}

test('P005 shows the unit conversion step', () => {
  assert.match(run('report_P005').results[0].steps.join(' '), /Converted 6 mmol\/L/);
});
test('P004 raises the urgent flag', () => assert.equal(run('report_P004').hasUrgent, true));
test('P012 asks for sex, not age', () => assert.deepEqual(run('report_P012').needsInfo, ['sex']));
