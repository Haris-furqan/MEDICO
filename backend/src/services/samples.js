// Loads the sample patient reports once and keeps them in memory.
// A file is a patient report only if it has a name and an MRN with a P-number (so organizer files are skipped).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReport } from '../engine/parse.js';
import { classifyReport } from '../engine/classify.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = process.env.LAB_DIR ?? path.resolve(here, '../../../lab_reports');

let samples = null;

export function loadSamples() {
  if (samples) return samples;
  const found = [];
  for (const file of fs.readdirSync(LAB_DIR).filter((f) => f.toLowerCase().endsWith('.md'))) {
    const text = fs.readFileSync(path.join(LAB_DIR, file), 'utf8');
    const parsed = parseReport(text);
    const id = parsed.patient.mrn?.match(/P\d{3}/i)?.[0]?.toUpperCase();
    if (!id || !parsed.patient.name) continue;
    found.push({ id, file, text, parsed, classified: classifyReport(parsed) });
  }
  if (!found.length) throw new Error(`No patient reports found in ${LAB_DIR}`);
  samples = found.sort((a, b) => a.id.localeCompare(b.id));
  return samples;
}

export const listSamples = () => loadSamples();
export const getSample = (id) => loadSamples().find((s) => s.id === String(id).toUpperCase());