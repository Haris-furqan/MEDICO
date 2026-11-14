# Backend: CityLab Lab Report Explainer (Tech Fusion '26, Problem B)

Person A: backend + AI. Stack: **Node + Express + Postgres**, Gemini for explanations. Frontend is in `../frontend` (Person B).

The app reads a patient's lab report, marks each value **normal / low / high / urgent**, explains it in simple words (class 8 level) and suggests questions for the doctor. It uses **only the lab's files**, **never diagnoses**, says so when the files don't cover something, and **never shares another patient's data**.

## 1. The one idea to remember

> **Code decides. The LLM only explains.**

Classification (name matching, unit conversion, range choice, urgent check) is deterministic code in `src/engine/`. The LLM only writes the plain-language text and doctor questions from already-classified results. So the results table is always correct, even if the LLM fails.

```
Report text ──► parse.js ──► classify.js ──► (save to Postgres) ──► Gemini explains ──► JSON ──► React
   no LLM        no LLM          no LLM                              guarded + cached
```

## 2. Layout and expected repo structure

```
<repo root>/
  lab_reports/            organizer files (given). Do not edit.
  backend/                this folder
    src/engine/           parse.js, classify.js, data.js, templateExplain.js   (DONE + tested)
    src/                  (you add) server.js, routes/, llm/, db/, guards/
    test/engine.test.js   17 tests, one per sample patient
    scripts/build-mocks.mjs   refreshes the frontend's mock data (see section 7)
    API_CONTRACT.md       the contract with the frontend. Keep it true.
  frontend/               Person B
```

## 3. Quick start

```bash
cd backend
npm test                       # expects ../lab_reports ; or LAB_DIR=/path/to/lab_reports npm test   (Node 20+)
```

## 4. What is already done (don't rewrite)

- `parse.js`: reads 7 report layouts (bullets, bold, tables, `->` arrows, `Test:/Result:` pairs, `Test Conducted:/Value Recorded:`), cuts the filler appendices first, never infers sex or age.
- `classify.js`: alias matching, unit conversion (shown in `steps[]`), urgent check, demographics gate, range choice, boundary rule (exactly on a limit is normal). Returns the exact objects described in `API_CONTRACT.md`.
- `data.js`: ranges, aliases, urgent limits, conversions, each with its source file.
- `templateExplain.js`: a no-LLM explanation. **Reuse it as the fallback** when Gemini fails.

## 5. What to build (in order)

1. **Express app**: `GET /api/patients`, `POST /api/analyze`, `POST /api/chat`, CORS, JSON errors exactly as in `API_CONTRACT.md`, 200 KB body limit.
   - `/api/analyze` = `parseReport` then `classifyReport`, then add `patient.id`, `explanation`, `explanationStatus`, `meta`.
   - `demographics` in the request overrides missing age/sex, then re-run.
2. **Postgres** (seed ranges from `data.js`; the engine must still work without a DB):
   `patients(id, name, age, sex, mrn, raw_text)`, `results(patient_id, raw_name, analyte, value, unit, status, steps jsonb)`, `llm_cache(key, response jsonb, created_at)`, `chat_messages(patient_id, role, text, created_at)`, `refusal_log(patient_id, message, reason, created_at)`.
3. **LLM client (Gemini)**, config via env, never hardcode the model:
   - JSON schema output, validated before returning.
   - **Retry with exponential backoff** on 429/5xx, then switch to `LLM_FALLBACK_MODEL`, then fall back to `templateExplanation` (`explanationStatus: "fallback"`). Rate-limit handling is scored.
   - **Cache** by hash of (classified results + prompt version).
   - Send the LLM only the classified results and the few glossary/safety lines it needs, never the raw files.
4. **Guards (in code, before and after the LLM):**
   - *Privacy*: if the chat message names another patient (name, full MRN, P-number, "other/all patients"), return the refusal **without calling the LLM** and log it. `../frontend/mock/mock-server.js` (`chat()`) is a working reference.
   - *No diagnosis*: scan LLM output for "you have", "diagnosed with", "suffering from" and similar; on a hit regenerate once, then use the template.
   - *Missing demographics*: never guess (the engine already enforces this).
5. **Extraction fallback**: if `parseReport` finds zero results on an unseen layout, ask Gemini to extract `{name, age, sex, results:[{rawName,value,unit}]}` as JSON, validate it, then run the **same** classifier.
6. **Tests** (keep adding), **Dockerfile + `docker-compose.yml`** (backend + Postgres), deployment.

### Env vars
```
PORT=4000
DATABASE_URL=postgres://...
GEMINI_API_KEY=...            # never commit; .env is gitignored
LLM_MODEL=gemini-2.5-flash
LLM_FALLBACK_MODEL=gemini-2.5-flash-lite
CORS_ORIGIN=http://localhost:5173
```

### Prompt rules (system prompt)
Use only the provided results. Class 8 reading level. Never say the patient has a disease; say only a licensed doctor can diagnose. For low/high say "can have many causes". Write 3 to 5 doctor questions about non-normal results. If any result is urgent, include a "see a doctor today" warning. Output JSON only.

## 6. Result statuses (what `classify.js` returns)

| status | Meaning |
|---|---|
| `normal` | in range (**exactly on a limit counts as normal**) |
| `low` / `high` | outside range |
| `urgent` | critical limit hit (`urgent: true`); takes precedence over low/high |
| `abnormal` | qualitative test not as expected (urine protein not "Negative") |
| `needs_info` | age and/or sex missing, range can't be chosen |
| `cannot_classify` | no range for this test, or unit not convertible |

## 7. Keeping the frontend's mock in sync

The frontend runs on a mock API that contains a **copy** of this engine (`../frontend/mock/engine/`). After you change anything in `src/engine/`, run:

```bash
cd backend
node scripts/build-mocks.mjs      # refreshes frontend/mock/engine/ and frontend/mock/mocks.json
```
It needs `../lab_reports` (or `LAB_DIR`). If you change a response shape, also update `API_CONTRACT.md` and tell Person B.

## 8. Rules from the lab files (the ground truth)

- `1_lab_safety_rules.md`: privacy lock (refuse other patients), no diagnosis, missing demographics (ask, never guess), unknown tests/units: "cannot be classified from the files".
- `2_medical_glossary.md`: SGPT = ALT, SGOT = AST, FBS = Fasting Blood Sugar, Hb = Hemoglobin, PLT = Platelet Count, WBC, RBC.
- `3_dangerous_urgent_values.md`: Hb < 7.0 g/dL, Fasting Blood Sugar > 300 mg/dL, Platelets < 50,000 cells/mcL, ALT > 1000 U/L.
- `4_ranges_hematology.md`: a value **exactly on a limit is NORMAL**; age upper bound inclusive.
- Ranges only cover ages **18 to 100**.

## 9. Known failure cases and assumptions (also for the judges)

1. **Unit conversion factors are not in the files.** We use standard clinical factors: glucose x 18.016, cholesterol x 38.67. Other mmol/L conversions are not attempted, so those tests are "cannot be classified".
2. **Urgent limits are strict** (`<` and `>` as in the table). Exactly 300 mg/dL is not urgent, even though the header says "hit or pass".
3. **Ages below 18 or above 100** have no range, so tests are marked cannot-classify, not guessed.
4. **RBC** is in the glossary but has no range sheet, so it is "cannot be classified from the files". Same for Serum Ferritin and any unknown test.
5. **The urgent check does not depend on age or sex**, so a patient with missing demographics still gets the urgent warning for a dangerous value.
6. **Only the demographics a test actually needs are required** (sugar: age; AST/ALT/Hemoglobin: age and sex).
7. **Qualitative tests**: urine protein is "normal" only when the value is "Negative"; anything else is `abnormal`, not diagnosed.
8. **Report formats**: 7 layouts are parsed by regex. Unseen layouts rely on the LLM extraction fallback, then the same deterministic classifier.
9. **MRN suffixes collide** (`...-9942` for every patient), so patients are identified by P-number or full MRN, never the suffix.
10. **Names never imply sex** (Bob Jones is recorded Female).
11. The LLM can still phrase things badly: mitigated by the output guard, the template fallback and the disclaimer on every explanation.

## 10. Deployment and submission

- **Backend**: Render/Railway. **DB**: Neon/Supabase free tier. If not hosted, the rules require Docker with a `docker-compose.yml` (frontend, backend, Postgres).
- **The Google Cloud credits expire on Nov 14 at 10:55 PM.** The deployed app must not depend on them. Use a free AI Studio or Groq key in the deployed environment and test it before submitting.
- Rate-limit and error handling are scored: keep retries and fallbacks visible in the code.
- **Commit early and often** (history is reviewed). Never commit `.env` or keys.
- Submission (ETL platform): GitHub repo link, live link (or Docker), demo video.

## 11. Suggested order of work

1. Express skeleton + `/api/patients` + `/api/analyze` wrapping the engine (frontend can switch from the mock as soon as this works).
2. Postgres schema, seed, save results.
3. Gemini client with schema output, retry/backoff/fallback, cache.
4. Chat endpoint with privacy and no-diagnosis guards.
5. Extraction fallback, Docker, deploy.
6. Known-failure section in the root README, more tests.
