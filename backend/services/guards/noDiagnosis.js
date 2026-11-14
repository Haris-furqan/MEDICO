// Output guard: catches diagnosis wording in LLM text. Caller regenerates once, then uses the template.
// NOTE: "not a diagnosis" / "can diagnose" (the disclaimer) must NOT match, so we never flag the word "diagnosis".
const BENIGN = '(?:an?\\s+|the\\s+|any\\s+|no\\s+|some\\s+|several\\s+|two\\s+|three\\s+|\\d+\\s+)?(?:questions?|results?|tests?|values?|reports?|readings?|numbers?|normal|low|high|urgent|abnormal|range|follow|appointments?|doctors?|options?)';

const PATTERNS = [
  new RegExp(`(?<!\\b(?:whether|if)\\s)\\byou (?:have|has|had)\\b(?!\\s+${BENIGN})`, 'i'),
  /\byou've got\b/i,
  /\byou (?:probably|likely|may|might|could|definitely) have\b/i,
  /\bdiagnosed with\b/i,
  /\bsuffering from\b/i,
  /\byou(?:'re| are) (?:anemic|anaemic|diabetic|prediabetic|hypothyroid|hyperthyroid|jaundiced|[a-z]+emic)\b/i,
];

export const violatesNoDiagnosis = (text) => PATTERNS.some((re) => re.test(String(text)));

// User is asking "do I have X?" -> chat answers WITHOUT a diagnosis, refusalReason: "no_diagnosis".
const ASKS = [
  /\bdo i have\b/i,
  /\bam i (?:diabetic|anemic|anaemic|sick|ill|dying|at risk)\b/i,
  /\b(?:what|which) (?:disease|condition|illness|disorder)\b.*\b(?:i have|do i)\b/i,
  /\bdiagnose (?:me|this)\b/i,
  /\bis (?:it|this) (?:cancer|diabetes|anemia|a disease)\b/i,
  /\bwhat'?s wrong with me\b/i,
];

export const asksForDiagnosis = (message) => ASKS.some((re) => re.test(String(message)));