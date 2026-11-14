// Deterministic, no-LLM explanation. Used (a) by the mock server and
// (b) by the real backend as the FALLBACK when Gemini fails (explanationStatus: "fallback").
const MEASURES = {
  'Hemoglobin': 'the protein in red blood cells that carries oxygen around the body',
  'White Blood Cell Count': 'the cells that help the body fight infections',
  'Platelet Count': 'the tiny cells that help blood clot',
  'Fasting Blood Sugar': 'the amount of sugar in the blood after not eating for several hours',
  'ALT': 'an enzyme found mostly in the liver',
  'AST': 'an enzyme found in the liver and muscles',
  'Cholesterol': 'a fatty substance in the blood',
  'TSH': 'a hormone that tells the thyroid gland how much to work',
  'Urine pH': 'how acidic or basic the urine is',
  'Urine Protein': 'whether protein is leaking into the urine',
};
const MEANING = {
  low: 'A low value can have many causes.',
  high: 'A high value can have many causes.',
  urgent: 'This value is in a range the lab treats as needing quick medical attention.',
  normal: "This is inside the lab's normal range for you.",
  abnormal: 'This is not the expected result.',
};
export const DISCLAIMER =
  'This explains numbers only. It is not a diagnosis. Only a licensed doctor can diagnose conditions.';

export function templateExplanation(classified) {
  const done = classified.results.filter((r) => ['normal', 'low', 'high', 'urgent', 'abnormal'].includes(r.status));
  if (!done.length) return null;
  const bad = done.filter((r) => r.status !== 'normal');
  const qs = bad.map(
    (r) => `What could be causing my ${r.analyte} to be ${r.status === 'urgent' ? (r.direction || 'outside the safe limit') : r.status}?`,
  );
  if (bad.length) {
    qs.push('Do I need a repeat test or any other tests?');
    qs.push('Is there anything I should change in my food, activity or medicines while I wait for follow-up?');
  }
  if (classified.hasUrgent) qs.unshift('Do I need treatment or a visit today?');
  return {
    summary: bad.length
      ? `${bad.length} of ${done.length} checked result${done.length === 1 ? '' : 's'} need${bad.length === 1 ? 's' : ''} a closer look with your doctor.`
      : 'All the results the lab could check are in the normal range.',
    perTest: done.map((r) => ({
      analyte: r.analyte,
      status: r.status,
      whatItMeasures: `${r.analyte} shows ${MEASURES[r.analyte] || 'a body measurement'}.`,
      whatItMeans: `${MEANING[r.status]} Only a doctor can say what it means for you.`,
    })),
    doctorQuestions: [...new Set(qs)].slice(0, 5),
    warnings: classified.hasUrgent ? ['URGENT: please see a doctor today.'] : [],
    disclaimer: DISCLAIMER,
  };
}
