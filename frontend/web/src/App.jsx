import { useState } from "react";
import PatientPicker from "./PatientPicker";
import PasteReport from "./PasteReport";

export default function App() {
  // What the user chose: { patientId } or { reportText } or null
  const [selection, setSelection] = useState(null);

  return (
    <div className="app">
      <h1>CityLab Lab Report Explainer</h1>
      <p className="subtitle">Pick a patient or paste a report.</p>

      <PatientPicker
        selectedId={selection?.patientId}
        onSelect={(id) => setSelection({ patientId: id })}
      />

      <PasteReport onSubmit={(text) => setSelection({ reportText: text })} />

      {/* Temporary: just to check the clicks work. Removed in Step 3 */}
      {selection && (
        <pre className="debug">{JSON.stringify(selection, null, 2).slice(0, 300)}</pre>
      )}
    </div>
  );
}