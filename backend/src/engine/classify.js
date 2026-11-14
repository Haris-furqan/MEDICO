import { RANGES, ALIASES, URGENT, CONVERSIONS } from './data.js';

export const canonicalName = (raw) => ALIASES[raw.trim().toLowerCase()] ?? null;

const norm = (u) => u.replace(/\s+/g, '').replace(/µ/g, 'mc').toLowerCase();

/**
 * Classify one result for one patient.
 * status: normal | low | high | abnormal | urgent | needs_info | cannot_classify
 * Every outcome carries `steps` (shown to the user) and `source` (file used) for citations.
 */
export function classifyResult(result, patient) {
  const steps = [];
  const out = { rawName: result.rawName, analyte: null, value: result.value ?? result.text, unit: result.unit,
                status: 'cannot_classify', direction: null, urgent: false, steps, source: null, missing: [] };

  // 1. Name matching
  const analyte = canonicalName(result.rawName);
  if (!analyte) {
    steps.push(`"${result.rawName}" has no match in the glossary or range sheets.`);
    out.reason = 'cannot be classified from the files';
    return out;
  }
  out.analyte = analyte;
  if (analyte.toLowerCase() !== result.rawName.trim().toLowerCase())
    steps.push(`Matched "${result.rawName}" to ${analyte} (2_medical_glossary.md).`);

  const candidates = RANGES.filter((r) => r.analyte === analyte);
  if (!candidates.length) {
    steps.push(`No reference range exists for ${analyte} in the range sheets.`);
    out.reason = 'cannot be classified from the files';
    return out;
  }
  const qualitative = candidates[0].qualitative;

  // 2. Unit conversion (before ANY comparison, including the urgent check)
  let value = result.value;
  let unit = result.unit;
  const stdUnit = candidates[0].unit;
  if (!qualitative) {
    if (value == null) {
      steps.push(`Expected a number for ${analyte} but found "${result.text}".`);
      out.reason = 'cannot be classified from the files';
      return out;
    }
    if (norm(unit) !== norm(stdUnit)) {
      const conv = CONVERSIONS[analyte]?.[unit];
      if (!conv) {
        steps.push(`Unit "${unit}" cannot be converted to ${stdUnit}; the files do not cover it.`);
        out.reason = 'cannot be classified from the files';
        return out;
      }
      const converted = Math.round(value * conv.factor * 10) / 10;
      steps.push(`Converted ${value} ${unit} x ${conv.factor} = ${converted} ${conv.to}.`);
      value = converted; unit = conv.to;
    }
    out.standardValue = value; out.standardUnit = stdUnit;
  }

  // 3. Urgent check. It does not depend on age or sex, so it runs before the demographics gate.
  const u = URGENT.find((x) => x.analyte === analyte);
  if (u && value != null) {
    const hit = u.op === '<' ? value < u.threshold : value > u.threshold;
    if (hit) {
      out.urgent = true;
      steps.push(`URGENT: ${value} ${u.unit} is ${u.op === '<' ? 'below' : 'above'} the critical limit of ${u.threshold} (3_dangerous_urgent_values.md).`);
    }
  }

  // 4. Pick the range. Never guess missing demographics.
  const sexSpecific = candidates.some((r) => r.sex !== 'All');
  const missing = [];
  if (patient.age == null) missing.push('age');
  if (patient.sex == null) missing.push('sex');
  const needed = [];
  if (patient.age == null) needed.push('age');
  if (sexSpecific && patient.sex == null) needed.push('sex');
  if (needed.length) {
    out.missing = missing; out.neededMissing = needed;
    out.reason = `the right normal range cannot be chosen: ${missing.join(' and ')} missing from the report`;
    steps.push(`Cannot choose a range: ${needed.join(' and ')} not provided. Ask the user instead of guessing (1_lab_safety_rules.md, rule 3).`);
    out.status = out.urgent ? 'urgent' : 'needs_info';
    return out;
  }
  const range = candidates.find((r) => (r.sex === 'All' || r.sex === patient.sex)
    && patient.age >= r.ageMin && patient.age <= r.ageMax);
  if (!range) {
    steps.push(`Age ${patient.age} is outside the ages covered by the range sheets (${candidates[0].ageMin}-${candidates[0].ageMax}).`);
    out.reason = 'cannot be classified from the files';
    out.status = out.urgent ? 'urgent' : 'cannot_classify';
    return out;
  }
  out.source = range.source;
  out.range = qualitative ? { expected: range.qualitative } : { min: range.min, max: range.max, unit: stdUnit, sex: range.sex };

  // 5. Compare. Values exactly on a limit are NORMAL (4_ranges_hematology.md edge-case rule).
  if (qualitative) {
    const ok = String(result.text).trim().toLowerCase() === qualitative.toLowerCase();
    out.status = ok ? 'normal' : 'abnormal';
    steps.push(`Expected "${qualitative}", found "${result.text}" -> ${out.status}.`);
  } else if (value < range.min) { out.direction = 'low';  out.status = 'low';
    steps.push(`${value} < ${range.min} (${range.sex} ${range.ageMin}-${range.ageMax}) -> low.`);
  } else if (value > range.max) { out.direction = 'high'; out.status = 'high';
    steps.push(`${value} > ${range.max} (${range.sex} ${range.ageMin}-${range.ageMax}) -> high.`);
  } else {
    out.status = 'normal';
    steps.push(`${range.min} <= ${value} <= ${range.max} -> normal${(value === range.min || value === range.max) ? ' (exactly on a limit counts as normal)' : ''}.`);
  }
  if (out.urgent) out.status = 'urgent';
  return out;
}

export function classifyReport(parsed) {
  const results = parsed.results.map((r) => classifyResult(r, parsed.patient));
  return {
    patient: parsed.patient,
    results,
    needsInfo: [...new Set(results.flatMap((r) => r.status === 'needs_info' || r.neededMissing?.length ? r.missing : []))],
    hasUrgent: results.some((r) => r.urgent),
  };
}
