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

    if (loading) return <p>Loading patients...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="patient-list">
            {patients.map((p) => (
                <button
                    key={p.id}
                    className={"patient-card" + (p.id === selectedId ? " selected" : "")}
                    onClick={() => onSelect(p.id)}
                >
                    <strong>{p.name}</strong>
                    <span>
                        Age: {p.age ?? "Not provided"} · Sex: {p.sex ?? "Not provided"}
                    </span>
                    <span className="tags">
                        {p.hasUrgent && (
                            <span className="tag urgent">
                                <i className="dot red"></i> Urgent
                            </span>
                        )}
                        {p.needsInfo.length > 0 && (
                            <span className="tag info">
                                <i className="dot blue"></i> Needs info
                            </span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
}