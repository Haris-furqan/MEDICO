# API Contract: CityLab Lab Report Explainer

Base URL: `/api`. All bodies are JSON (UTF-8). Frontend: run `node mock/mock-server.js` (same URLs and shapes as the real backend) or import `mock/mocks.json` directly. All 14 sample patients are generated from the real classifier.

## Conventions

- **Classification is done by code, never by the LLM.** `results[]` is deterministic. Only `explanation` comes from the LLM, so `results[]` is always present even when the LLM is down.
- `status` is one of:

| status | Meaning | Suggested UI |
|---|---|---|
| `normal` | inside the range (a value exactly on a limit is normal) | green |
| `low` / `high` | outside the range | amber |
| `urgent` | hit a critical limit (always also set `urgent: true`) | red + banner |
| `abnormal` | qualitative test that is not the expected value (urine protein) | amber |
| `needs_info` | age and/or sex missing, range cannot be chosen | blue + form |
| `cannot_classify` | no range for the test, or a unit that cannot be converted | grey |

- `urgent` takes precedence over `low`/`high`. For an urgent result, `direction` still says `low`/`high` when a range was found.
- Urgent checks do **not** need age or sex, so a `needs_info` patient can still come back with `status: "urgent"` and `missing: [...]`.
- `steps[]` is human-readable text for the "show your work" panel (alias match, unit conversion, comparison). `source` names the file the range came from, for citations.
- Sex is exactly `"Male"` or `"Female"`; unknown is `null`. Never infer sex or age from a name.
- Errors always use: `{ "error": { "code": "STRING", "message": "human text" } }`.

## GET /api/patients

Lists the sample patients for the picker.

Response 200:
```json
{
  "patients": [
    {
      "id": "P001",
      "name": "Alice Smith",
      "age": 28,
      "sex": "Female",
      "mrn": "CLD-P001-9942",
      "testCount": 2,
      "hasUrgent": false,
      "needsInfo": []
    },
    {
      "id": "P002",
      "name": "Bob Jones",
      "age": 35,
      "sex": "Female",
      "mrn": "CLD-P002-9942",
      "testCount": 1,
      "hasUrgent": false,
      "needsInfo": []
    },
    {
      "id": "P003",
      "name": "Charlie Brown",
      "age": null,
      "sex": null,
      "mrn": "CLD-P003-9942",
      "testCount": 1,
      "hasUrgent": false,
      "needsInfo": [
        "age",
        "sex"
      ]
    }
  ]
}
```
(The real response lists all 14. `hasUrgent` can drive a red dot; `needsInfo` a blue one.)

## POST /api/analyze

Analyze one report. Provide **either** `patientId` (a sample patient) **or** `reportText` (pasted or uploaded markdown/text). `demographics` is optional and **overrides** missing values: this is how the "needs info" form re-runs the analysis.

Request:
```json
{
  "patientId": "P012",
  "demographics": {
    "sex": "Female"
  }
}
```
```json
{
  "reportText": "# CITYLAB ... (full report text)"
}
```

| Field | Type | Notes |
|---|---|---|
| `patientId` | string | `P001`..`P014` |
| `reportText` | string | up to 200 KB; filler appendices are ignored |
| `demographics.age` | integer | 0..120 |
| `demographics.sex` | `"Male"`\|`"Female"` | |

Response 200 (urgent example, `P004`):
```json
{
  "patient": {
    "id": "P004",
    "name": "Diana Prince",
    "age": 42,
    "sex": "Female",
    "mrn": "CLD-P004-9942"
  },
  "results": [
    {
      "rawName": "Hemoglobin",
      "analyte": "Hemoglobin",
      "value": 6.5,
      "unit": "g/dL",
      "status": "urgent",
      "direction": "low",
      "urgent": true,
      "steps": [
        "URGENT: 6.5 g/dL is below the critical limit of 7 (3_dangerous_urgent_values.md).",
        "6.5 < 12.1 (Female 18-100) -> low."
      ],
      "source": "4_ranges_hematology.md",
      "missing": [],
      "standardValue": 6.5,
      "standardUnit": "g/dL",
      "range": {
        "min": 12.1,
        "max": 15.1,
        "unit": "g/dL",
        "sex": "Female"
      },
      "neededMissing": []
    },
    {
      "rawName": "Platelet Count",
      "analyte": "Platelet Count",
      "value": 120000,
      "unit": "cells/mcL",
      "status": "low",
      "direction": "low",
      "urgent": false,
      "steps": [
        "120000 < 150000 (All 18-100) -> low."
      ],
      "source": "4_ranges_hematology.md",
      "missing": [],
      "standardValue": 120000,
      "standardUnit": "cells/mcL",
      "range": {
        "min": 150000,
        "max": 450000,
        "unit": "cells/mcL",
        "sex": "All"
      },
      "neededMissing": []
    }
  ],
  "needsInfo": [],
  "hasUrgent": true,
  "explanation": {
    "summary": "2 of 2 checked results need a closer look with your doctor.",
    "perTest": [
      {
        "analyte": "Hemoglobin",
        "status": "urgent",
        "whatItMeasures": "Hemoglobin shows the protein in red blood cells that carries oxygen around the body.",
        "whatItMeans": "This value is in a range the lab treats as needing quick medical attention. Only a doctor can say what it means for you."
      },
      {
        "analyte": "Platelet Count",
        "status": "low",
        "whatItMeasures": "Platelet Count shows the tiny cells that help blood clot.",
        "whatItMeans": "A low value can have many causes. Only a doctor can say what it means for you."
      }
    ],
    "doctorQuestions": [
      "Do I need treatment or a visit today?",
      "What could be causing my Hemoglobin to be low?",
      "What could be causing my Platelet Count to be low?",
      "Do I need a repeat test or any other tests?",
      "Is there anything I should change in my food, activity or medicines while I wait for follow-up?"
    ],
    "warnings": [
      "URGENT: please see a doctor today."
    ],
    "disclaimer": "This explains numbers only. It is not a diagnosis. Only a licensed doctor can diagnose conditions."
  },
  "explanationStatus": "ok",
  "meta": {
    "cached": false,
    "model": "gemini-2.5-flash",
    "ms": 1840
  }
}
```

Response 200 (needs-info example, `P012`: sex missing, no explanation yet):
```json
{
  "patient": {
    "id": "P012",
    "name": "Laura Croft",
    "age": 32,
    "sex": null,
    "mrn": "CLD-P012-9942"
  },
  "results": [
    {
      "rawName": "AST",
      "analyte": "AST",
      "value": 44,
      "unit": "U/L",
      "status": "needs_info",
      "direction": null,
      "urgent": false,
      "steps": [
        "Cannot choose a range: sex not provided. Ask the user instead of guessing (1_lab_safety_rules.md, rule 3)."
      ],
      "source": null,
      "missing": [
        "sex"
      ],
      "standardValue": 44,
      "standardUnit": "U/L",
      "reason": "the right normal range cannot be chosen: sex missing from the report",
      "neededMissing": [
        "sex"
      ]
    }
  ],
  "needsInfo": [
    "sex"
  ],
  "hasUrgent": false,
  "explanation": null,
  "explanationStatus": "skipped",
  "meta": {
    "cached": false,
    "model": "gemini-2.5-flash",
    "ms": 1840
  }
}
```

Response fields:

| Field | Notes |
|---|---|
| `patient` | `id` is `null` for pasted reports |
| `results[]` | one per test, order as in the report |
| `results[].rawName` / `analyte` | name as printed / canonical name. `analyte` is `null` for unknown tests |
| `results[].value`, `unit` | as printed. `value` is a string for qualitative tests ("Negative") |
| `results[].standardValue`, `standardUnit` | after conversion. Absent for qualitative or unknown tests |
| `results[].range` | `{min,max,unit,sex}`, or `{expected}` for qualitative. Absent when no range was chosen |
| `results[].missing` | all missing demographics (`["age","sex"]`) |
| `results[].neededMissing` | only the ones this test actually needs (sugar needs age, not sex; AST needs both) |
| `results[].reason` | shown to the user when status is `needs_info` or `cannot_classify` |
| `needsInfo` | report-level list of demographics to ask for |
| `hasUrgent` | true if any result is urgent: show the banner |
| `explanation` | `null` when nothing could be classified (`explanationStatus: "skipped"`) |
| `explanationStatus` | `ok`, `fallback` (template text because the LLM failed), `skipped` |
| `meta` | `cached`, `model`, `ms`. Handy for the demo and debugging |

Rules for `explanation`: simple words (class 8), never a diagnosis, 3 to 5 `doctorQuestions` when anything is abnormal, `warnings` non-empty whenever `hasUrgent`. The `disclaimer` is always present.

Errors:

| HTTP | code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | neither `patientId` nor `reportText`, or invalid demographics |
| 404 | `PATIENT_NOT_FOUND` | unknown `patientId` |
| 422 | `NO_RESULTS_FOUND` | the report parsed, but no test results could be read |

LLM failure is **not** an error: return 200 with `explanationStatus: "fallback"`.

## POST /api/chat

Patient-locked Q&A. The server, not the LLM, enforces the lock.

Request:
```json
{
  "patientId": "P004",
  "message": "What does my hemoglobin of 6.5 mean?"
}
```
`history` (optional): `[{ "role": "user"|"assistant", "text": "..." }]`, last 10 turns.

Response 200:
```json
{
  "reply": "Hemoglobin is the protein in red blood cells that carries oxygen. Your value of 6.5 g/dL is below the lab's critical limit of 7.0, so please see a doctor today. I can't say why it is low; only a doctor can diagnose that.",
  "refused": false,
  "refusalReason": null,
  "citations": [
    "3_dangerous_urgent_values.md",
    "4_ranges_hematology.md"
  ]
}
```

`refusalReason` is `null` for normal answers, otherwise:

| value | When |
|---|---|
| `other_patient` | message names another patient, MRN or P-number. `refused: true`, no LLM call |
| `no_diagnosis` | user asks "do I have X?". Answer is given **without** a diagnosis, `refused: false` |
| `off_topic` | not about this report |

Refusal example:
```json
{
  "request": {
    "patientId": "P004",
    "message": "What were Ethan Hunt's sugar results?"
  },
  "response": {
    "reply": "I can only discuss the report that is currently open. I can't share another patient's results.",
    "refused": true,
    "refusalReason": "other_patient",
    "citations": [
      "1_lab_safety_rules.md"
    ]
  }
}
```

Errors: `400 BAD_REQUEST` (missing message), `404 PATIENT_NOT_FOUND`. If the patient has `needs_info` results, chat may answer about the rest but must say which results cannot be classified until age/sex are given.

## The 14 sample patients and what the UI should show

| Patient | Expected |
|---|---|
| P001 Alice Smith | Hemoglobin: normal, White Blood Cell Count: normal |
| P002 Bob Jones | ALT: normal |
| P003 Charlie Brown | Fasting Blood Sugar: needs_info |
| P004 Diana Prince | Hemoglobin: urgent, Platelet Count: low |
| P005 Ethan Hunt | Fasting Blood Sugar: high |
| P006 Fiona Gallagher | Serum Ferritin: cannot_classify |
| P007 George Costanza | TSH: normal |
| P008 Haley Dunphy | Urine pH: normal, Urine Protein: normal |
| P009 Ian Malcolm | ALT: high, AST: high |
| P010 Julia Child | Cholesterol: normal |
| P011 Kevin Hart | White Blood Cell Count: high, Platelet Count: low |
| P012 Laura Croft | AST: needs_info |
| P013 Michael Scott | Fasting Blood Sugar: urgent |
| P014 Nancy Drew | Fasting Blood Sugar: normal, AST: normal |

## Flows the frontend must handle

1. **Pick patient** then `POST /api/analyze {patientId}` and render table, banner, explanation.
2. **Needs info** (`needsInfo.length > 0`): show a small form for exactly the fields in `needsInfo`, then re-call `/api/analyze` with `demographics`. Show the other results meanwhile.
3. **Urgent** (`hasUrgent`): red banner at the top using `explanation.warnings`, and place the doctor questions first.
4. **Cannot classify**: show the grey row with `reason`, no guess.
5. **Chat**: always send the current `patientId`. Render `refused: true` replies as a distinct, calm "I can't share that" bubble.
6. **LLM down** (`explanationStatus: "fallback"`): show a small "simplified explanation" notice; the table stays fully correct.
