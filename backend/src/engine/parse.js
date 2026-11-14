// Parses a CityLab report (.md text) into { patient, results }.
// Handles every format seen in the 14 sample reports: bullets, bold, tables, "->" arrows,
// "Test:/Result:" pairs and "Test Conducted:/Value Recorded:" pairs.
// The filler appendices are cut off first, so legal/QC text can never leak into results.

const strip = (s) => s.replace(/\*\*/g, '').replace(/^[\s*\-•]+/, '').trim();

function field(text, label) {
  const m = text.match(new RegExp(`${label}\\*{0,2}\\s*:\\s*\\*{0,2}\\s*(.+)`, 'i'));
  return m ? m[1].replace(/\*\*/g, '').trim() : null;
}

export function parseValue(raw) {
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  if (m) return { value: parseFloat(m[1]), unit: m[2].trim(), text: null };
  return { value: null, unit: '', text: raw.trim() };
}

export function parseReport(markdown) {
  const text = markdown.replace(/\r/g, '');
  const body = text.split(/^###\s*APPENDIX/m)[0]; // drop filler

  const ageRaw = field(body, 'Recorded Age');
  const sexRaw = field(body, 'Biological Sex');
  const age = ageRaw && /^\d+$/.test(ageRaw) ? parseInt(ageRaw, 10) : null;
  const sex = sexRaw && /^(male|female)$/i.test(sexRaw)
    ? sexRaw[0].toUpperCase() + sexRaw.slice(1).toLowerCase() : null;

  const patient = {
    name: field(body, 'Patient Full Name'),
    age, sex,
    ageRaw, sexRaw,
    mrn: field(body, 'Medical Record Number \\(MRN\\)'),
  };

  const section = body.split(/^##\s*SECTION III[^\n]*\n/m)[1] || '';
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  const results = [];
  let pendingName = null;

  for (const line of lines) {
    // markdown table row
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((c) => strip(c));
      if (cells.length < 2 || /^:?-+:?$/.test(cells[0])) continue;       // separator
      if (/^(result|value)$/i.test(cells[1])) continue;                  // header
      const v = parseValue(cells[1]);
      results.push({ rawName: cells[0], value: v.value, text: v.text, unit: cells[2] ?? v.unit });
      continue;
    }
    const clean = strip(line);
    // arrow format:  pH Level -> 5.5
    let m = clean.match(/^(.+?)\s*->\s*(.+)$/);
    if (m) { const v = parseValue(m[2]); results.push({ rawName: m[1].trim(), ...v }); continue; }
    // colon format
    m = clean.match(/^(.+?):\s*(.+)$/);
    if (!m) continue; // narrative sentence such as "...presented below:" has nothing after the colon
    const [, key, val] = m;
    if (/^(test|test conducted)$/i.test(key)) { pendingName = val.trim(); continue; }
    if (/^(result|value recorded)$/i.test(key) && pendingName) {
      results.push({ rawName: pendingName, ...parseValue(val) });
      pendingName = null; continue;
    }
    // plain "Name: value unit". Ignore narrative sentences (long keys).
    if (key.split(/\s+/).length <= 5) results.push({ rawName: key.trim(), ...parseValue(val) });
  }
  return { patient, results };
}
