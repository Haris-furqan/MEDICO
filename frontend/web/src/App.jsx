import { useEffect, useState } from "react";
import PatientPicker from "./PatientPicker";
import PasteReport from "./PasteReport";
import ResultView from "./ResultView";
import LabBackground from "./LabBackground";
import { analyze } from "./api";

function friendlyError(err) {
  if (err.code === "NO_RESULTS_FOUND")
    return "We couldn't read any test results from this report. Please check the text and try again.";
  if (err.code === "PATIENT_NOT_FOUND")
    return "That patient could not be found.";
  if (err instanceof TypeError)
    return "Can't reach the server. Please check that the API is running.";
  return err.message || "Something went wrong. Please try again.";
}

function Skeleton() {
  return (
    <div className="skeleton">
      <div className="sk-line wide"></div>
      <div className="sk-line" style={{ width: "80%" }}></div>
      <div className="sk-line" style={{ width: "65%" }}></div>
      <div className="sk-line" style={{ width: "75%" }}></div>
      <div className="sk-line" style={{ width: "55%" }}></div>
    </div>
  );
}

export default function App() {
  const [selection, setSelection] = useState(null); // { patientId } or { reportText }
  const [demographics, setDemographics] = useState(null); // { age?, sex? } or null
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function choose(newSelection) {
    setDemographics(null); // a new choice starts fresh
    setSelection(newSelection);
  }

  useEffect(() => {
    if (!selection) return;
    let cancelled = false;

    setLoading(true);
    setError("");
    // For a fresh choice, clear the old result.
    // For a re-run with demographics, keep showing the old results meanwhile.
    if (demographics === null) setData(null);

    const body = demographics ? { ...selection, demographics } : selection;

    analyze(body)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selection, demographics]);

  return (
    <div className="app">
      <LabBackground />
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-logo" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
            <path d="M18 6h12v12h12v12H30v12H18V30H6V18h12z" fill="currentColor" />
          </svg>
          <span className="logo-ring" />
        </div>
        <div className="app-header-text">
          <h1>Medico</h1>
          <p className="subtitle">Lab Report Explainer · Pick a patient, upload or paste a report to get started.</p>
        </div>
        <svg className="ecg" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 20h70l8-14 10 30 10-34 8 18h40l8-8 8 8h138" />
        </svg>
      </header>

      {/* ── Patient picker ── */}
      <div className="section-divider">Select a patient</div>
      <PatientPicker
        selectedId={selection?.patientId}
        onSelect={(id) => choose({ patientId: id })}
      />

      {/* ── Paste box ── */}
      <PasteReport onSubmit={(text) => choose({ reportText: text })} />

      {/* ── States ── */}
      {loading && !data && <Skeleton />}
      {error && (
        <div className="error-box" role="alert">
          <span className="error-box-icon" aria-hidden="true">⚠</span>
          {error}
        </div>
      )}
      {data && (
        <ResultView data={data} busy={loading} onRerun={setDemographics} />
      )}
    </div>
  );
}
