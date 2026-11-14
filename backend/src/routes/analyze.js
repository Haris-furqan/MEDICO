import { Router } from 'express';
import { parseReport } from '../engine/parse.js';
import { classifyReport } from '../engine/classify.js';
import { templateExplanation } from '../engine/templateExplain.js';
import { getSample } from '../services/samples.js';
import { explain, extractReport } from '../llm/gemini.js';
import { ApiError } from '../errors.js';

const router = Router();

const CLASSIFIED = ['normal', 'low', 'high', 'urgent', 'abnormal'];

function validateDemographics(d) {
  if (d == null) return {};
  if (typeof d !== 'object' || Array.isArray(d)) {
    throw new ApiError(400, 'BAD_REQUEST', 'demographics must be an object.');
  }
  const out = {};
  if (d.age != null) {
    if (!Number.isInteger(d.age) || d.age < 0 || d.age > 120) {
      throw new ApiError(400, 'BAD_REQUEST', 'demographics.age must be an integer from 0 to 120.');
    }
    out.age = d.age;
  }
  if (d.sex != null) {
    if (d.sex !== 'Male' && d.sex !== 'Female') {
      throw new ApiError(400, 'BAD_REQUEST', 'demographics.sex must be "Male" or "Female".');
    }
    out.sex = d.sex;
  }
  return out;
}

// POST /api/analyze
router.post('/analyze', async (req, res, next) => {
  try {
    const t0 = Date.now();
    const { patientId, reportText, demographics } = req.body ?? {};

    if (patientId == null && reportText == null) {
      throw new ApiError(400, 'BAD_REQUEST', 'Provide either patientId or reportText.');
    }
    const demo = validateDemographics(demographics);

    // 1. Get the report text
    let text;
    let id = null;
    if (patientId != null) {
      const sample = typeof patientId === 'string' ? getSample(patientId) : null;
      if (!sample) throw new ApiError(404, 'PATIENT_NOT_FOUND', `No patient with id "${patientId}".`);
      text = sample.text;
      id = sample.id;
    } else {
      if (typeof reportText !== 'string' || !reportText.trim()) {
        throw new ApiError(400, 'BAD_REQUEST', 'reportText must be a non-empty string.');
      }
      text = reportText;
    }

    // 2. Parse (no LLM). If nothing found, try the LLM extraction fallback.
    let parsed = parseReport(text);
    if (!parsed.results.length) {
      try {
        parsed = (await extractReport(text)) ?? parsed;
      } catch (err) {
        console.error('extraction fallback failed:', err.message);
      }
    }
    if (!parsed.results.length) {
      throw new ApiError(422, 'NO_RESULTS_FOUND', 'The report was read, but no test results could be found.');
    }

    // 3. Demographics from the request override what the report has
    if (demo.age != null) parsed.patient.age = demo.age;
    if (demo.sex != null) parsed.patient.sex = demo.sex;

    // 4. Classify (no LLM)
    const classified = classifyReport(parsed);

    // 5. Explain (LLM, with fallback). Skip if nothing could be classified.
    let explanation = null;
    let explanationStatus = 'skipped';
    let cached = false;
    let model = process.env.LLM_MODEL;

    if (classified.results.some((r) => CLASSIFIED.includes(r.status))) {
      try {
        const out = await explain(classified);
        explanation = out.explanation;
        explanationStatus = out.status; // 'ok' | 'fallback'
        cached = out.cached ?? false;
        model = out.model ?? model;
      } catch (err) {
        console.error('explain() failed, using template:', err.message);
        explanation = templateExplanation(classified);
        explanationStatus = 'fallback';
      }
    }

    // 6. Response. LLM failure is never an error.
    const p = parsed.patient;
    res.json({
      patient: { id, name: p.name, age: p.age, sex: p.sex, mrn: p.mrn },
      results: classified.results,
      needsInfo: classified.needsInfo,
      hasUrgent: classified.hasUrgent,
      explanation,
      explanationStatus,
      meta: { cached, model, ms: Date.now() - t0 },
    });
  } catch (err) {
    next(err);
  }
});

export default router;