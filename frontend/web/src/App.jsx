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
  // What the user chose: { patientId } or { reportText } or null
  const [selection, setSelection] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selection) return;
    let cancelled = false; // ignore old answers if the user clicks quickly

    setLoading(true);
    setError("");
    setData(null);

    analyze(selection)
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
  }, [selection]);

  return (
    <div className="app">
      <h1>CityLab Lab Report Explainer</h1>
      <p className="subtitle">Pick a patient or paste a report.</p>

      <PatientPicker
        selectedId={selection?.patientId}
        onSelect={(id) => setSelection({ patientId: id })}
      />

      <PasteReport onSubmit={(text) => setSelection({ reportText: text })} />

      {loading && <Skeleton />}
      {error && <p className="error">{error}</p>}
      {data && <ResultView data={data} />}
    </div>
  );
}