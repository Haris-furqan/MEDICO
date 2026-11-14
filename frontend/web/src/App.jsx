import { useEffect, useState } from "react";
import PatientPicker from "./PatientPicker";
import PasteReport from "./PasteReport";
import ResultView from "./ResultView";
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
      <div className="sk-line"></div>
      <div className="sk-line"></div>
      <div className="sk-line"></div>
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
      <h1>CityLab Lab Report Explainer</h1>
      <p className="subtitle">Pick a patient or paste a report.</p>

      <PatientPicker
        selectedId={selection?.patientId}
        onSelect={(id) => choose({ patientId: id })}
      />

      <PasteReport onSubmit={(text) => choose({ reportText: text })} />

      {loading && !data && <Skeleton />}
      {error && <p className="error">{error}</p>}
      {data && (
        <ResultView data={data} busy={loading} onRerun={setDemographics} />
      )}
    </div>
  );
}