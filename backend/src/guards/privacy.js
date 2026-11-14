// Privacy lock. Pure code, no LLM. Returns true if the message asks about someone other than `current`.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const clean = (s) => s.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');

const GENERIC = [
  /\b(?:other|another|different|all|every|any)\s+(?:other\s+)?(?:patients?|people|persons?|clients?|customers?)\b/i,
  /\b(?:someone|somebody|anyone|anybody)\s+else\b/i,
  /\b(?:my|his|her|their)\s+(?:friend|wife|husband|mother|father|mom|dad|brother|sister|neighbou?r|colleague|boss|son|daughter)(?:'s)?\s+(?:report|results?|labs?|tests?)\b/i,
];

export function isOtherPatientRequest(message, current, all) {
  const msg = clean(message);
  const low = msg.toLowerCase();
  const curId = current.id;
  const curMrn = (current.parsed.patient.mrn ?? '').toLowerCase();
  const curParts = new Set((current.parsed.patient.name ?? '').toLowerCase().split(/\s+/).filter(Boolean));
  const knownIds = new Set(all.map((s) => s.id));

  // 1. "other patients", "someone else", "my mother's results"
  if (GENERIC.some((re) => re.test(msg))) return true;

  // 2. P-numbers (P004, p-4). Flag known ids, and any 3-digit P-number.
  for (const m of low.matchAll(/\bp-?0*(\d{1,3})\b/g)) {
    const id = 'P' + m[1].padStart(3, '0');
    if (id !== curId && (knownIds.has(id) || /^p-?\d{3}$/.test(m[0]))) return true;
  }

  // 3. Full MRN. Never the "-9942" suffix: every patient has it.
  for (const m of low.matchAll(/\bcld-p?\d+-\d+\b/g)) {
    if (m[0] !== curMrn) return true;
  }

  // 4. Other patients' names. Current patient's own name parts are allowed.
  //    First name: any case. Last name: only if capitalised ("Child" yes, "child" no).
  for (const s of all) {
    if (s.id === curId) continue;
    const name = s.parsed.patient.name?.trim();
    if (!name) continue;
    if (low.includes(name.toLowerCase())) return true;
    const parts = name.split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (first.length >= 3 && !curParts.has(first.toLowerCase()) && new RegExp(`\\b${esc(first)}\\b`, 'i').test(msg)) return true;
    if (parts.length > 1 && last.length >= 3 && !curParts.has(last.toLowerCase()) && new RegExp(`\\b${esc(last)}\\b`).test(msg)) return true;
  }
  return false;
}