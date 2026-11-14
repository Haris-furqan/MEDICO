import { Router } from 'express';
import { listSamples } from '../services/samples.js';

const router = Router();

// GET /api/patients
router.get('/patients', (req, res, next) => {
  try {
    const patients = listSamples().map((s) => ({
      id: s.id,
      name: s.parsed.patient.name,
      age: s.parsed.patient.age,
      sex: s.parsed.patient.sex,
      mrn: s.parsed.patient.mrn,
      testCount: s.classified.results.length,
      hasUrgent: s.classified.hasUrgent,
      needsInfo: s.classified.needsInfo,
    }));
    res.json({ patients });
  } catch (err) {
    next(err);
  }
});

export default router;