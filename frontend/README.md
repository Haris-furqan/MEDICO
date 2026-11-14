# Frontend: CityLab Lab Report Explainer (Tech Fusion '26, Problem B)

Person B: frontend + deploy + submission. Stack: **React** (Vite suggested). The backend is built by Person A in `../backend`; until it is ready you work against the **mock API** in this folder.

The app reads a patient's lab report, marks each value **normal / low / high / urgent**, explains it in simple words (class 8 level) and suggests questions for the doctor. It never diagnoses, says so when the lab files don't cover something, and never shows another patient's data.

> **Code decides, the LLM only explains.** All classification is done by the backend. The frontend never computes statuses, ranges or conversions: it only renders what the API returns.

## 1. Quick start

You only need this `frontend/` folder and Node 20+. No install, no keys for the mock.

```bash
cd frontend
node mock/mock-server.js            # fake API on http://localhost:4000/api  (PORT=5000 to change)
```

Create the React app in a subfolder (so the mock stays untouched):

```bash
npm create vite@latest web -- --template react
cd web && npm install
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm run dev
```

When Person A's backend is ready, change only `VITE_API_URL`. Deploy with root directory `frontend/web`.

Full API details are in **`API_CONTRACT.md`** (same folder). Read it before you start.

## 2. The mock server

It runs the **real** classifier, so these behave exactly like the final backend: re-running with age/sex, pasting a report, and the chat privacy refusal. Only the explanation text is a template.

| Send this request header | Effect |
|---|---|
| `x-mock-llm: down` | `explanationStatus: "fallback"` (test the "LLM is down" notice) |
| `x-mock-delay: 3000` | slow response (test loading states). Default 400 ms |

`mock/mocks.json` has pre-built responses for all 14 patients if you want static data for prototyping (`analyze.P004`, `analyze.P012`, `chat[0..2]`).

## 3. API summary

| Endpoint | Purpose |
|---|---|
| `GET /api/patients` | list of 14 sample patients |
| `POST /api/analyze` | `{patientId}` or `{reportText}`, optional `{demographics:{age,sex}}` |
| `POST /api/chat` | `{patientId, message, history?}`, patient-locked Q&A |

Errors always look like `{ "error": { "code": "...", "message": "..." } }`.

```bash
curl localhost:4000/api/patients
curl -X POST localhost:4000/api/analyze -H 'Content-Type: application/json' -d '{"patientId":"P012"}'
curl -X POST localhost:4000/api/analyze -H 'Content-Type: application/json' -d '{"patientId":"P012","demographics":{"sex":"Female"}}'
curl -X POST localhost:4000/api/chat -H 'Content-Type: application/json' -d '{"patientId":"P004","message":"What were Ethan Hunt sugar results?"}'
```

## 4. Result statuses

| status | Meaning | UI |
|---|---|---|
| `normal` | in range (**exactly on a limit counts as normal**) | green |
| `low` / `high` | outside range | amber |
| `urgent` | critical limit hit (`urgent: true`) | red + page banner |
| `abnormal` | qualitative test not as expected (urine protein) | amber |
| `needs_info` | age and/or sex missing, range can't be chosen | blue + form |
| `cannot_classify` | no range for this test, or unit not convertible | grey |

Do not rely on color alone: always show the status word and an icon.

## 5. Screens

1. **Patient picker / paste box.** List from `GET /api/patients` (name, age, sex; red dot if `hasUrgent`, blue dot if `needsInfo.length`). Also a textarea/upload for a pasted report (`reportText`).
2. **Result view** for one patient:
   - **Urgent banner** at the very top when `hasUrgent` (use `explanation.warnings`).
   - **Results table**: test, value + unit, status badge, normal range (`range`), and an expandable **"How we got this"** that lists `steps[]` (alias match, unit conversion, comparison) and `source`.
   - **Plain-language section**: `explanation.summary` and `perTest[]`.
   - **Questions for your doctor**: `explanation.doctorQuestions` (3 to 5).
   - **Disclaimer** (`explanation.disclaimer`) always visible.
3. **Chat box**, locked to the current patient (always send the current `patientId`).

## 6. States you must handle

| Situation | How to detect | What to show |
|---|---|---|
| Loading | request in flight | skeleton (a real LLM takes 2 to 4 s) |
| Needs info | `needsInfo.length > 0` | A small form for the fields in `needsInfo`. Mark a field **required** only if it appears in some `results[].neededMissing` (P003 needs age but not sex; P012 needs sex). On submit, call `/api/analyze` again with `demographics`. Keep showing the other results meanwhile. |
| Urgent | `hasUrgent` | Red banner; doctor questions shown first |
| Cannot classify | `status: "cannot_classify"` | grey row showing `reason`; never invent a range |
| LLM down | `explanationStatus: "fallback"` | small notice "simplified explanation"; the table stays fully correct |
| Nothing explainable | `explanation === null` (`"skipped"`) | hide the explanation section; show each row's `reason` |
| Chat refused | `refused: true` | calm, distinct bubble ("I can't share that"); not an error style |
| API error | non-2xx with `error.code` | friendly message; `NO_RESULTS_FOUND` means "couldn't read this report" |

## 7. Display rules

- Never write "you have ..." in your own UI copy. Only show what the API returns.
- `value` is a **string** for qualitative tests ("Negative"), a **number** otherwise. Show `unit` next to it.
- If `standardValue` differs from `value`, show both (6 mmol/L becomes 108.1 mg/dL). This is the "units conversion" the judges look for.
- Sex is exactly `"Male"`, `"Female"` or `null`. Show "Not provided" for `null`.
- Demographics a user types are **not** saved; they only re-run the analysis.

## 8. Per-patient test checklist

| Patient | What you should see |
|---|---|
| P001 Alice Smith | Hemoglobin normal, WBC normal |
| P002 Bob Jones | ALT **normal** (45 is exactly on the female limit; recorded sex is Female) |
| P003 Charlie Brown | Fasting Blood Sugar **needs_info**; form asks for age (required) and sex |
| P004 Diana Prince | Hemoglobin **urgent** (6.5), Platelets low. Red banner |
| P005 Ethan Hunt | Fasting Blood Sugar **high**; shows 6 mmol/L converted to 108.1 mg/dL |
| P006 Fiona Gallagher | Serum Ferritin **cannot_classify** (grey, no explanation) |
| P007 George Costanza | TSH normal |
| P008 Haley Dunphy | Urine pH normal, Urine Protein normal (qualitative) |
| P009 Ian Malcolm | ALT high, AST high |
| P010 Julia Child | Cholesterol **normal** (200 is exactly on the limit) |
| P011 Kevin Hart | WBC high, Platelets low |
| P012 Laura Croft | AST **needs_info** (sex). With Female: high (44 > 43). With Male: normal |
| P013 Michael Scott | Fasting Blood Sugar **urgent** (350). Red banner |
| P014 Nancy Drew | Fasting Blood Sugar normal, AST normal |

Chat samples to try on P004: "What does my hemoglobin mean?" (answered), "What were Ethan Hunt sugar results?" (refused, `other_patient`), "Do I have anemia?" (answered with no diagnosis, `no_diagnosis`).

## 9. Deployment and submission (your part)

- Deploy `frontend/web` on Vercel/Netlify; set `VITE_API_URL` to the deployed backend URL (ask Person A for it). Check CORS works.
- If the app can't be hosted, the rules require Docker with a `docker-compose.yml`; agree with Person A on one compose file.
- **The Google Cloud credits expire on Nov 14 at 10:55 PM.** The deployed backend must not depend on them (Person A uses a free key); test the live link at the end.
- **Commit early and often** (commit history is reviewed). Never commit keys or `.env`.
- Submission (ETL platform): GitHub repo link, live link (or Docker), **demo video**. Record it using these in order: P004 (urgent), P005 (unit conversion), P012 (needs info, then enter sex), P006 (cannot classify), and the chat refusing another patient.

## 10. Suggested order of work

1. Vite app, patient picker, call the mock server.
2. Results table with status badges and the "How we got this" steps.
3. Urgent banner, needs-info form + re-run, explanation and doctor questions.
4. Chat UI with the refusal bubble, plus loading and error states.
5. Switch `VITE_API_URL` to the real backend, polish, deploy.
6. Demo video.
