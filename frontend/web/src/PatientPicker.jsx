import { useEffect, useState } from "react";
import { getPatients } from "./api";

export default function PatientPicker({ selectedId, onSelect }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getPatients()
            .then(setPatients)
            .catch(() => setError("Could not load the patient list. Is the API running?"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="skeleton" style={{ marginTop: 0 }}>
            <div className="sk-line" style={{ height: "60px", borderRadius: "10px", width: "100%" }}></div>
        </div>
    );
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="patient-list">
            {patients.map((p) => (
                <button
                    key={p.id}
                    className={"patient-card" + (p.id === selectedId ? " selected" : "")}
                    onClick={() => onSelect(p.id)}
                >
                    <strong className="patient-name">{p.name}</strong>
                    <span className="patient-meta">
                        Age: {p.age ?? "Not provided"} · Sex: {p.sex ?? "Not provided"}
                    </span>
                    <span className="tags">
                        {p.hasUrgent && (
                            <span className="tag urgent">
                                <span aria-hidden="true">⚠</span> Urgent
                            </span>
                        )}
                        {p.needsInfo.length > 0 && (
                            <span className="tag info">
                                <span aria-hidden="true">ℹ</span> Needs info
                            </span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
}
