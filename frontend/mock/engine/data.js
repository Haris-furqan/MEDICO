// Reference data transcribed from the CityLab files. Every row keeps its source file for citations.
// Later: seed these into Postgres (ranges, aliases, urgent_limits, conversions) with the same shape.

export const RANGES = [
  // 4_ranges_hematology.md
  { analyte: 'Hemoglobin', sex: 'Male',   ageMin: 18, ageMax: 100, min: 13.8, max: 17.2, unit: 'g/dL', source: '4_ranges_hematology.md' },
  { analyte: 'Hemoglobin', sex: 'Female', ageMin: 18, ageMax: 100, min: 12.1, max: 15.1, unit: 'g/dL', source: '4_ranges_hematology.md' },
  { analyte: 'White Blood Cell Count', sex: 'All', ageMin: 18, ageMax: 100, min: 4500, max: 11000, unit: 'cells/mcL', source: '4_ranges_hematology.md' },
  { analyte: 'Platelet Count', sex: 'All', ageMin: 18, ageMax: 100, min: 150000, max: 450000, unit: 'cells/mcL', source: '4_ranges_hematology.md' },
  // 5_ranges_biochemistry.md
  { analyte: 'Fasting Blood Sugar', sex: 'All',    ageMin: 18, ageMax: 100, min: 70, max: 99,  unit: 'mg/dL', source: '5_ranges_biochemistry.md' },
  { analyte: 'ALT',  sex: 'Male',   ageMin: 18, ageMax: 100, min: 7, max: 55, unit: 'U/L', source: '5_ranges_biochemistry.md' },
  { analyte: 'ALT',  sex: 'Female', ageMin: 18, ageMax: 100, min: 7, max: 45, unit: 'U/L', source: '5_ranges_biochemistry.md' },
  { analyte: 'AST',  sex: 'Male',   ageMin: 18, ageMax: 100, min: 8, max: 48, unit: 'U/L', source: '5_ranges_biochemistry.md' },
  { analyte: 'AST',  sex: 'Female', ageMin: 18, ageMax: 100, min: 8, max: 43, unit: 'U/L', source: '5_ranges_biochemistry.md' },
  { analyte: 'Cholesterol', sex: 'All', ageMin: 18, ageMax: 100, min: 125, max: 200, unit: 'mg/dL', source: '5_ranges_biochemistry.md' },
  // 6_ranges_thyroid_urine.md
  { analyte: 'TSH',        sex: 'All', ageMin: 18, ageMax: 100, min: 0.4, max: 4.0, unit: 'mIU/L', source: '6_ranges_thyroid_urine.md' },
  { analyte: 'Urine pH',   sex: 'All', ageMin: 18, ageMax: 100, min: 4.5, max: 8.0, unit: '', source: '6_ranges_thyroid_urine.md' },
  { analyte: 'Urine Protein', sex: 'All', ageMin: 18, ageMax: 100, qualitative: 'Negative', unit: '', source: '6_ranges_thyroid_urine.md' },
];

// Test-name aliases (lowercase key -> canonical name). 2_medical_glossary.md, plus the obvious
// full names and the urine labels used in report P008 (pH Level / Protein).
export const ALIASES = {
  'sgpt': 'ALT', 'alt': 'ALT', 'alanine aminotransferase': 'ALT',
  'sgot': 'AST', 'ast': 'AST', 'aspartate aminotransferase': 'AST',
  'fbs': 'Fasting Blood Sugar', 'fasting blood sugar': 'Fasting Blood Sugar',
  'hb': 'Hemoglobin', 'hemoglobin': 'Hemoglobin',
  'plt': 'Platelet Count', 'platelet count': 'Platelet Count',
  'wbc': 'White Blood Cell Count', 'white blood cell count': 'White Blood Cell Count',
  'rbc': 'Red Blood Cell Count', 'red blood cell count': 'Red Blood Cell Count', // known name, but NO range sheet entry
  'cholesterol': 'Cholesterol',
  'tsh': 'TSH',
  'ph level': 'Urine pH', 'urine ph': 'Urine pH', 'ph': 'Urine pH',
  'protein': 'Urine Protein', 'urine protein': 'Urine Protein',
};

// 3_dangerous_urgent_values.md (strict inequalities, as written in the table). Units are the standard unit.
export const URGENT = [
  { analyte: 'Hemoglobin',          op: '<', threshold: 7.0,   unit: 'g/dL' },
  { analyte: 'Fasting Blood Sugar', op: '>', threshold: 300,   unit: 'mg/dL' },
  { analyte: 'Platelet Count',      op: '<', threshold: 50000, unit: 'cells/mcL' },
  { analyte: 'ALT',                 op: '>', threshold: 1000,  unit: 'U/L' },
];

// ASSUMPTION: the files give NO conversion factors. These are the standard clinical factors.
// from-unit -> multiply to reach the standard unit. Anything not listed => "cannot be classified".
export const CONVERSIONS = {
  'Fasting Blood Sugar': { 'mmol/L': { factor: 18.016, to: 'mg/dL' } },
  'Cholesterol':         { 'mmol/L': { factor: 38.67,  to: 'mg/dL' } },
};
