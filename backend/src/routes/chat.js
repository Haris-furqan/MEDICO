import { Router } from 'express';
import { getSample, listSamples } from '../services/samples.js';
import { isOtherPatientRequest } from '../guards/privacy.js';
import { answerChat } from '../llm/gemini.js';
import { logRefusal } from '../db/refusalLog.js';
import { ApiError } from '../errors.js';

const router = Router();

const REFUSAL_TEXT =
  "I can only discuss the report that is currently open. I can't share another patient's results.";

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string')
    .slice(-10)
    .map((h) => ({ role: h.role, text: h.text.slice(0, 1000) }));
}

// POST /api/chat
router.post('/chat', async (req, res, next) => {
  try {
    const { patientId, message, history } = req.body ?? {};

    if (typeof message !== 'string' || !message.trim()) {
      throw new ApiError(400, 'BAD_REQUEST', 'message is required.');
    }
    if (message.length > 2000) {
      throw new ApiError(400, 'BAD_REQUEST', 'message is too long (max 2000 characters).');
    }
    if (typeof patientId !== 'string') {
      throw new ApiError(400, 'BAD_REQUEST', 'patientId is required.');
    }
    const sample = getSample(patientId);
    if (!sample) throw new ApiError(404, 'PATIENT_NOT_FOUND', `No patient with id "${patientId}".`);

    // 1. Privacy guard. Code decides. No LLM call on a hit.
    if (isOtherPatientRequest(message, sample, listSamples())) {
      try {
        await logRefusal({ patientId, message, reason: 'other_patient' });
      } catch (err) {
        console.error('refusal log failed:', err.message); // DB down must not break the refusal
      }
      return res.json({
        reply: REFUSAL_TEXT,
        refused: true,
        refusalReason: 'other_patient',
        citations: ['1_lab_safety_rules.md'],
      });
    }

    // 2. LLM answers from this patient's classified results only.
    //    answerChat must run the no-diagnosis output guard (regenerate once, then safe fallback).
    const out = await answerChat({
      classified: sample.classified,
      message,
      history: cleanHistory(history),
    });

    // 3. If some results need age/sex, say so in code (not left to the LLM).
    let reply = out.reply;
    const pending = sample.classified.results.filter((r) => r.status === 'needs_info');
    if (pending.length) {
      const names = [...new Set(pending.map((r) => r.analyte))].join(', ');
      const missing = [...new Set(pending.flatMap((r) => r.neededMissing ?? []))].join(' and ');
      reply += `\n\nNote: I can't classify ${names} until ${missing} is provided.`;
    }

    const reason = out.refusalReason ?? null;
    res.json({
      reply,
      refused: reason === 'other_patient' || reason === 'off_topic',
      refusalReason: reason,
      citations: out.citations ?? [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;